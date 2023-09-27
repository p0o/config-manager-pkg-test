const {
    SSMClient,
    GetParametersByPathCommand
} = require('@aws-sdk/client-ssm');
const { promises: fs } = require('fs');
const yaml = require('js-yaml');
const get = require('lodash.get');

const Logger = require('../utils/Logger');
const {
    CONFIG_FILE_NAME,
    BASE_KEY_PATH,
    SECRET_PATH
} = require('../constants');

class ECS {
    constructor(region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION) {
        this.region = region;
        this.client = new SSMClient({ region });
    }

    async getParametersByPath(parameterPath, region, nextToken, parameters = []) {
        const params = {
            Path: parameterPath,
            Recursive: true,
            MaxResults: 10,
            NextToken: nextToken,
            WithDecryption: true
        };

        const response = await this.client.send(new GetParametersByPathCommand(params));

        // Concatenate the newly retrieved parameters with the previous ones.
        const allParameters = parameters.concat(response.Parameters || []);

        if (response.NextToken) {
            // Make a recursive call if there are more parameters to retrieve.
            return this.getParametersByPath(parameterPath, region, response.NextToken, allParameters);
        }

        return allParameters;
    }

    async loadSecrets() {
        try {
            const envCache = process.env.ENV_CACHE || false;
            if (envCache) return JSON.parse(envCache);

            const config = yaml.load(await fs.readFile(`${process.cwd()}/${CONFIG_FILE_NAME}`, 'utf8'));

            const baseSSMPath = get(config, BASE_KEY_PATH, []);

            const secretKeys = await this.getParametersByPath(baseSSMPath, this.region);

            const allowedSecretsKeys = new Set(get(config, SECRET_PATH, []));

            const secrets = {};

            for (const secretKey of secretKeys) {
                const key = secretKey.Name.replace(baseSSMPath, '').replace('/', '');

                if (allowedSecretsKeys.has(key)) {
                    secrets[key] = secretKey.Value;
                    process.env[key] = secretKey.Value;
                }
            }

            // Check if all the secrets are loaded and identify the missing variables
            const notLoadedSecrets = [...allowedSecretsKeys].filter((element) => !new Set(Object.keys(secrets)).has(element));

            if (notLoadedSecrets.length > 0) {
                Logger.log(`These Secret variables/ secrets not loaded: ${notLoadedSecrets.join(', ')}`);
            }

            process.env.SECRET_CACHE = JSON.stringify(secrets);

            return secrets;
        } catch (error) {
            Logger.log('Unable to load secret variables from Parameter Store');
            return {};
        }
    }
}

module.exports = ECS;