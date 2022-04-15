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
    return transform.process.call({ logger }, {
      data: {
        first: 'Renat',
        last: 'Zubairov',
      },
      attachments: {},
      metadata: {},
    }, {
      expression: '{ "fullName": first & " " & last }',
    }).then((result) => {
      expect(result.data).to.deep.equal({
        fullName: 'Renat Zubairov',
      });
    });
  });

  it('should not produce an empty message if transformation returns undefined', () => {
    return transform.process.call({ logger }, {
      data: {
        first: 'Renat',
        last: 'Zubairov',
      },
      attachments: {},
      metadata: {},
    }, {
      expression: '$[foo=2].({ "foo": boom })',
    }).then((result) => {
      expect(result).to.be.an('undefined');
    });
  });

  it('should handle passthough properly', () => {
    const msg = {
      data: {
        first: 'Renat',
        last: 'Zubairov',
      },
      attachments: {},
      metadata: {},
    };
    msg.passthrough = {
      ps: 'psworks',
    };
    return transform.process.call({ logger }, msg, {
      expression: '{ "fullName": first & " " & elasticio.ps}',
    }).then((result) => {
      expect(result.data).to.deep.equal({
        fullName: 'Renat psworks',
      });
    });
  });

  it('should handle getFlowVariables properly', () => {
    const msg = {
      data: {
        first: 'Renat',
        last: 'Zubairov',
      },
      attachments: {},
      metadata: {},
    };
    msg.passthrough = {
      ps: 'psworks',
    };
    const flowVariables = {
      var1: 'value1',
      var2: 'value2',
    };
    return transform.process.call({ logger, getFlowVariables: () => flowVariables }, msg, {
      expression: '$getFlowVariables()',
    }).then((result) => {
      expect(result.data).to.deep.equal(flowVariables);
    });
  });

  it('should call getPassthrough', () => {
    const msg = {
      data: {
        first: 'Renat',
        last: 'Zubairov',
      },
      attachments: {},
      metadata: {},
    };
    msg.passthrough = {
      ps: 'psworks',
    };
    return transform.process.call({ logger }, msg, {
      expression: '$getPassthrough()',
    }).then((result) => {
      expect(result.data).to.deep.equal({
        ps: 'psworks',
      });
    });
  });
});
