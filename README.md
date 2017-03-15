# step

An [Amazon State Language](https://states-language.net/spec.html) based state machine.

It is probably worth pointing out that this design probably isn't terribly
practical in reality. There are many ways to solve this problem, but the current
structure was chosen for ease of development, to better understand the problem
space, and to get a feel for the Amazon State Language spec itself. One could
imagine many different approaches, including:
- Separate the validation and execution steps. Validation and deployment of a
versus the runtime invocation are distinctly different as it pertains to the
lifecycle of the state machine. One approach could be to validate both
structure and data integrity, then place the valid specification in a data
store. At runtime the state machine could reference that specification by name,
retrieve it, and run the machine to completion.
- Generate the state machine implementation. Perhaps a more efficient solution
would be to generate and deploy the complete implementation (a FaaS Function)
based on the provided spec. The platform could either change the implementation
of how it would fulfill remote Tasks based on the FaaS provider, or the
implementation could be provided by the author. (I like this one, personally.)

## Basic API
```js
const json = {
    "StartAt": "Demo",
    "States": {
        "Demo": {
            "Type": "Pass",
            "Result": {
                "pass": {
                    "a": "b"
                }
            },
            "Next": "Done"
        },
        "Done": {
            "Type": "Succeed"
        }
    }
};

const input = {
    foo: {
        bar: true,
    },
};

const machine = Machine.create(json);
const result = await machine.run(input);
console.log(result);
```

## Testing
```bash
$ npm test
```

##### Notes
- The Node runtime version (in `.npmrc`) was explicitly chosen for OpenWhisk
compatibility. The associated stability that comes with selecting one runtime
is preferred for now (in the early stages of development) over flexbility
across providers.
- There are many things in this codebase that could be written much more tersely.
The goal is to keep expressiveness and readability until other factors, such as
performance, dictate otherwise.
- The overall mental model here is `Machine -> States -> {1..n} State -> Type`
where the `State` implementation is provided by the `Type` in a kind of
Flyweight pattern.
- Be aware that some `Type`s compose `States` as well. For example, `Parallel`
and `Choice` run state machines internal to their type.
- Even though Classes are used, this codebase favors exposing Factories over
Constructors both internally and externally.
