const test = require('ava');
const Factory = require('./factory');


test('Factory', t => {

    const json = {
        StartAt: 'One',
        States: {
            One: {
                Type: 'Pass',
                Next: 'Two',
            },
            Two: {
                Type: 'Wait',
                Next: 'Three',
            },
            Three: {
                Type: 'Pass',
                Next: 'Four',
            },
            Four: {
                Type: 'Succeed',
            },
        },
    };

    const factory = Factory.create(json.States);
    const machine = factory.build(json.StartAt);
    return machine.run({ a: 'foo' }).then(output => {
        t.is(output.a, 'foo');
    });

});


test('Fail', t => {

    const json = {
        StartAt: 'One',
        States: {
            One: {
                Type: 'Fail',
                Error: 'An error.',
                Cause: 'A cause.',
            },
        },
    };

    const factory = Factory.create(json.States);
    const machine = factory.build(json.StartAt);
    const p = machine.run({});
    return t.throws(p).catch(({ Error, Cause }) => {
        t.is(Error, 'An error.');
        t.is(Cause, 'A cause.');
    });

});


test('Task', t => {

    const json = {
        StartAt: 'One',
        States: {
            One: {
                Type: 'Task',
                Resource: 'test',
                Catch: [{
                    ErrorEquals: [ 'States.ALL' ],
                    Next: 'Two',
                }],
                Next: 'Two',
            },
            Two: {
                Type: 'Succeed',
            },
        },
    };

    const factory = Factory.create(json.States);
    const machine = factory.build(json.StartAt);

    let state = machine;
    t.is(state.name, 'One');
    t.is(state.type, 'Task');
    t.is(state.catchers.length, 1);
    t.is(state.catchers[0].next, machine.next);

    state = machine.next;
    t.is(state.name, 'Two');
    t.is(state.type, 'Succeed');

    return machine.run({}).then(result => {
        t.truthy(result);
    });

});


test('Catch', t => {

    const json = {
        StartAt: 'One',
        States: {
            One: {
                Type: 'Task',
                Resource: 'test',
                TimeoutSeconds: 1,
                Catch: [{
                    ErrorEquals: [ 'States.ALL' ],
                    Next: 'Three',
                }],
                Next: 'Two',
            },
            Two: {
                Type: 'Succeed',
            },
            Three: {
                Type: 'Fail',
                Error: 'Broken',
            }
        },
    };

    const factory = Factory.create(json.States);
    const machine = factory.build(json.StartAt);

    let state = machine;
    t.is(state.name, 'One');
    t.is(state.type, 'Task');
    t.is(state.catchers.length, 1);

    state = machine.catchers[0].next
    t.is(state.name, 'Three');

    state = machine.next;
    t.is(state.name, 'Two');
    t.is(state.type, 'Succeed');

    const promise = machine.run({ SleepSeconds: [ 2 ] });
    return t.throws(promise).catch(({ Error, Cause }) => {
        t.is(Error, 'States.Timeout');
        t.is(Cause, 'Request timeout.');
        return 'ok';
    });

});


// test('Builder', t => {
//
//     const json = {
//         StartAt: 'One',
//         States: {
//             One: {
//                 Type: 'Pass',
//                 Next: 'Two',
//             },
//             Two: {
//                 Type: 'Task',
//                 Resource: 'abc123',
//                 Catch: [{
//                     ErrorEquals: [ 'States.ALL'],
//                     Next: 'Three',
//                 }],
//                 Next: 'Three'
//             },
//             Three: {
//                 Type: 'Choice',
//                 Choices: [
//                     {
//                         StringEquals: 'value',
//                         Next: 'Four',
//                     }
//                 ],
//                 Default: 'Four'
//             },
//             Four: {
//                 Type: 'Parallel',
//                 Branches: [{
//                     StartAt: 'FourOne',
//                     States: {
//                         FourOne: {
//                             Type: 'Pass',
//                             Next: 'FourTwo',
//                         },
//                         FourTwo: {
//                             Type: 'Pass',
//                             End: true,
//                         },
//                     },
//                 }],
//                 Next: 'Five',
//                 Catch: [{
//                     ErrorEquals: [ 'States.ALL'],
//                     Next: 'Five',
//                 }]
//             },
//             Five: {
//                 Type: 'Succeed'
//             },
//         },
//     };
//
//     const machine = Builder.build(json);
//     console.log(machine);
// });
