const middy = require('@middy/core');
const ssm = require('@middy/ssm');
const { getInternal } = require('@middy/util');
const get = require('lodash.get');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

const {
    CONFIG_FILE_NAME,
    BASE_KEY_PATH,
    SECRET_PATH
} = require('../constants');

const getSecretKeys = () => {
    try {
        const configFilePath = path.join(__dirname, `../../../../${CONFIG_FILE_NAME}`);
        const configFile = fs.readFileSync(configFilePath, 'utf8');
        const config = yaml.load(configFile);

        const baseSSMPath = get(config, BASE_KEY_PATH, '');
        const allowedSecretsKeys = get(config, SECRET_PATH, []);

        const keysMap = {};
        for (const key of allowedSecretsKeys) {
            const ssmKey = `${baseSSMPath}/${key}`;
            keysMap[key] = ssmKey;
        }

        return keysMap;
    } catch (error) {
        return {};
    }
};

const lambdaWrapper = (handler) => {
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
        // SSM middleware wrapper only use in non-local environment
        const keysMap = getSecretKeys();
        const ssmMiddleware = ssm({ fetchData: keysMap });

        return middy(handler).use(ssmMiddleware).before(async (request) => {
            
            const secretKeys = Object.keys(keysMap);
            const data = await getInternal(
                secretKeys,
                request
            );

            Object.assign(request.context, data);
            for (const key of secretKeys) {
                
                const value = data[key];
                process.env[key] = value;
            }
        });
    } else {
        return handler;
    }
};

module.exports = {
    lambdaWrapper
};