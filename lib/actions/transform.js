/* eslint-disable max-len */
const jsonata = require('jsonata');
const lookup = require('country-code-lookup');
const { wrapper } = require('@blendededge/ferryman-extensions');

/**
 * This method will be called from Open Integration Hub platform providing following data
 *
 * @param msg incoming message object that contains ``data`` with payload
 * @param cfg configuration that is account information and configuration field values
 */
// eslint-disable-next-line consistent-return
async function processAction(msg, cfg, snapshots, msgHeaders, tokenData) {
  let self;

  try {
    self = await wrapper(this, msg, cfg, snapshots, msgHeaders, tokenData);
    self.logger.debug('msg is ', JSON.stringify(msg));
    self.logger.debug('cfg is ', JSON.stringify(cfg));

    const { expression } = cfg;
    const compiledExpression = jsonata(expression);

    if (self.getFlowVariables) {
      self.logger.debug('assigning getFlowVariables');
      compiledExpression.assign('getFlowVariables', () => self.getFlowVariables());
    }

    if (cfg.extendedFunctions) {
      self.logger.debug('assigning extendedFunctions');
      compiledExpression.registerFunction('iso2to3', (iso2) => lookup.byIso(iso2).iso3);
      compiledExpression.registerFunction('phoneCodeToIso3', (phoneCode) => lookup.byIso(phoneCode).iso3);
    }
    return compiledExpression.evaluate(msg).then(async (result) => {
      self.logger.info('Evaluation completed');
      if (result === undefined || result === null || Object.keys(result).length === 0) {
        // this may be userful for debugging
        let resultValue = '';
        if (result === null) {
          resultValue = 'null';
        } else if (result === undefined) {
          resultValue = 'undefined';
        } else {
          resultValue = 'empty object';
        }
        self.logger.info('Result from evaluation is empty object or null or undefined, no message will be send to the next step');
        self.emit('trace:empty-jsonata-result', { data: `Result from evaluation is ${resultValue}` });
        self.emit('end');
        return Promise.resolve();
      }

      if (typeof result[Symbol.iterator] === 'function') {
        // We have an iterator as result
        self.logger.debug('Result from evaluation is an array, each item of the array will be send to the next step as a separate message');
        let resultCount = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const item of result) {
          // eslint-disable-next-line no-await-in-loop
          await self.emit('data', { data: item });
          resultCount += 1;
        }
        self.logger.info(`${resultCount} messages were sent to the next step`);
        if (resultCount === 0) {
          self.logger.info('Result from evaluation is an empty iterable, no message will be sent to the next step');
          self.emit('trace:empty-jsonata-result', { data: 'Result from evaluation is an empty iterable, no message will be sent to the next step' });
        }
        self.emit('end');
        return Promise.resolve();
      }

      self.logger.debug('1 message will be send to the next step');
      self.logger.debug('result from evaluation is: ', JSON.stringify(result));
      await self.emit('data', { data: result });
      self.emit('end');
      return Promise.resolve();
    }).catch((e) => {
      const errorMessage = `JSONata transformation failed! message: "${e.message}", position: "${e.position}", code: "${e.code}", token: "${e.token}", value: "${e.value}"`;
      self.logger.error(errorMessage);
      self.emit('error', errorMessage);
    });
  } catch (e) {
    const errorMessage = `JSONata transformation failed! message: "${e.message}", position: "${e.position}", code: "${e.code}", token: "${e.token}", value: "${e.value}"`;
    self.logger.error(errorMessage);
    self.emit('error', errorMessage);
  }
}

module.exports.process = processAction;
