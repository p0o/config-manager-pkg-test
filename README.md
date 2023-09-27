# Config Manager Package
## Introduction
This package mainly handle all the secrets and non-secrets management for the sub projects in Main [Respond.io repository](https://github.com/respond-io/respond-io). This Supports for AWS ECS services and Lambda functions.

## Installation
1. Run the following command to install package into project.
```sh
npm i @respond-io/config-manager-pkg --save
```
2. For ECS services you can use following code snippet to initialize the package.
```javascript
// For local development, load environment variables from .env file
if (!(process.env.ECS_CONTAINER_METADATA_URI_V4 || process.env.ECS_CONTAINER_METADATA_URI)) {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env' });
} else {
    const ECS = require('@respond-io/config-manager-pkg')('ecs');
    const ecsConfig = new ECS();
    await ecsConfig.loadSecrets();
}
```
3. For Lambda functions you can use following code snippet to initialize the package.

```javascript
//in /layer../app/index.js
const { lambdaWrapper } = require('@respond-io/config-manager-pkg')('lambda');
...
...
module.exports = {
    SSMLambdaWrapper: lambdaWrapper
};
```
```javascript
//in /functions/<function-name>/app.js
const { ...., SSMLambdaWrapper } = require('app');
...
const lambdaHandler = async (event) => { 
    // Lambda Logic
}
...
exports.lambdaHandler = SSMLambdaWrapper(lambdaHandler);
```

### Reference
#### Notion Posts
- [Environment Variable / Secret Management](https://www.notion.so/respond/Environment-Variable-Secret-Management-Simplified-c35ffe8b728344289b542bbc9ca0c572)