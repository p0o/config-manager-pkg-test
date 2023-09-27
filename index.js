module.exports = (type) => {
    if (type === 'ecs') {
        return require('./src/ECS');
    } else if (type === 'lambda') {
        return require('./src/Lambda');
    } else {
        throw new Error(`Invalid type: ${type}`);
    }
};