/* eslint-disable arrow-body-style */
const { expect } = require('chai');
const transform = require('../lib/actions/transform');

// stub logger to prevent errors
const logger = {
  debug: () => {},
  info: () => {},
  error: () => {},
};

describe('Transformation test', () => {
  it('should handle simple transforms', () => {
    let response;
    const emit = (type, data) => { response = data; };
    return transform.process.call({ logger, emit }, {
      data: {
        first: 'Renat',
        last: 'Zubairov',
      },
      attachments: {},
      metadata: {},
    }, {
      expression: '$$.data.{ "fullName": first & " " & last }',
    }).then(() => {
      expect(response.data).to.deep.equal({
        fullName: 'Renat Zubairov',
      });
    });
  });

  it('should not produce an empty message if transformation returns undefined', () => {
    let response;
    const emit = (type, data) => { response = data; };
    return transform.process.call({ logger, emit }, {
      data: {
        first: 'Renat',
        last: 'Zubairov',
      },
      attachments: {},
      metadata: {},
    }, {
      expression: '$[foo=2].({ "foo": boom })',
    }).then(() => {
      expect(response).to.be.an('undefined');
    });
  });

  it('should handle passthough properly', () => {
    let response;
    const emit = (type, data) => { response = data; };
    const msg = {
      data: {
        first: 'Renat',
        last: 'Zubairov',
      },
      attachments: {},
      metadata: {
        passthrough: {
          stepA: {
            abc: 'psworks',
          },
        },
      },
    };
    return transform.process.call({ logger, emit }, msg, {
      expression: '{ "fullName": data.first & " " & metadata.passthrough.stepA.abc}',
    }).then(() => {
      expect(response.data).to.deep.equal({
        fullName: 'Renat psworks',
      });
    });
  });

  it('should handle getFlowVariables properly', () => {
    let response;
    const emit = (type, data) => { response = data; };
    const msg = {
      data: {
        first: 'Renat',
        last: 'Zubairov',
      },
      attachments: {},
      metadata: {},
    };
    const flowVariables = {
      var1: 'value1',
      var2: 'value2',
    };
    return transform.process.call({ logger, emit, getFlowVariables: () => flowVariables }, msg, {
      expression: '$getFlowVariables()',
    }).then(() => {
      expect(response.data).to.deep.equal(flowVariables);
    });
  });
});
