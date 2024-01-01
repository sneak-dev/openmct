# Framework Architecture

## Overview

The framework layer's most basic responsibility is allowing individual
software components to communicate. The software components it recognizes
are:

* _Extensions_: Individual units of functionality that can be added to
  or removed from Open MCT Web. _Extension categories_ distinguish what
  type of functionality is being added/removed.
* _Bundles_: A grouping of related extensions
  (named after an analogous concept from [OSGi](http://www.osgi.org/))
  that may be added or removed as a group.

The framework layer operates by taking a set of active bundles, and
exposing extensions to one another as-needed, using
[dependency injection](https://en.wikipedia.org/wiki/Dependency_injection).
Extensions are responsible for declaring their dependencies in a
manner which the framework layer can understand.

```nomnoml
#direction: down
[Open MCT Web|
  [Dependency injection framework]-->[Platform bundle #1]
  [Dependency injection framework]-->[Platform bundle #2]
  [Dependency injection framework]-->[Plugin bundle #1]
  [Dependency injection framework]-->[Plugin bundle #2]
  [Platform bundle #1|[Extensions]]
  [Platform bundle #2|[Extensions]]
  [Plugin bundle #1|[Extensions]]
  [Plugin bundle #2|[Extensions]]
  [Platform bundle #1]<->[Platform bundle #2]
  [Plugin bundle #1]<->[Platform bundle #2]
  [Plugin bundle #1]<->[Plugin bundle #2]
]
```

The "dependency injection framework" in this case is
[AngularJS](https://angularjs.org/). Open MCT Web's framework layer
is really just a thin wrapper over Angular that recognizes the
concepts of bundles and extensions (as declared in JSON files) and
registering extensions with Angular. It additionally acts as a
mediator between Angular and [RequireJS](http://requirejs.org/),
which is used to load JavaScript sources which implement
extensions.

```nomnoml
[Framework layer|
  [AngularJS]<-[Framework Component]
  [RequireJS]<-[Framework Component]
  [Framework Component]1o-*[Bundles]
]
```

It is worth noting that _no other components_ are "aware" of the
framework component directly; Angular and Require are _used by_ the
framework components, and extensions in various bundles will have
their dependencies satisfied by Angular as a consequence of registration
activities which were performed by the framework component.


## Application Initialization

The framework component initializes an Open MCT Web application following
a simple sequence of steps.

```nomnoml
[<start> Start]->[<state> Load bundles.json]
[Load bundles.json]->[<state> Load bundle.json files]
[Load bundle.json files]->[<state> Resolve implementations]
[Resolve implementations]->[<state> Register with Angular]
[Register with Angular]->[<state> Bootstrap application]
[Bootstrap application]->[<end> End]
```

1. __Loading bundles.json.__ A file named `bundles.json` is loaded to determine
   which bundles to load. Bundles are given in this file as relative paths
   which point to bundle directories.
2. __Load bundle.json files.__ Individual bundle definitions are loaded; a
   `bundle.json` file is expected in each bundle directory.
2. __Resolving implementations.__ Any scripts which provide implementations for
   extensions exposed by bundles are loaded, using RequireJS.
3. __Register with Angular.__ Resolved extensions are registered with Angular,
   such that they can be used by the application at run-time. This stage
   includes both registration of Angular built-ins (directives, controllers,
   routes, constants, and services) as well as registration of non-Angular
   extensions.
4. __Bootstrap application.__ Once all extensions have been registered,
   the Angular application
   [is bootstrapped](https://docs.angularjs.org/guide/bootstrap).

## Architectural Paradigm

```nomnoml
[Extension]
[Extension]o->[Dependency #1]
[Extension]o->[Dependency #2]
[Extension]o->[Dependency #3]
```

Open MCT Web's architecture relies on a simple premise: Individual units
(extensions) only have access to the dependencies they declare that they
need, and they acquire references to these dependencies via dependency
injection. This has several desirable traits:

* Programming to an interface is enforced. Any given dependency can be
  swapped out for something which exposes an equivalent interface. This
  improves flexibility against refactoring, simplifies testing, and
  provides a common mechanism for extension and reconfiguration.
* The dependencies of a unit must be explicitly defined. This means that
  it can be easily determined what a given unit's role is within the
  larger system, in terms of what other components it will interact with.
  It also helps to enforce good separation of concerns: When a set of
  declared dependencies becomes long it is obvious, and this is usually
  a sign that a given unit is involved in too many concerns and should
  be refactored into smaller pieces.
* Individual units do not need to be aware of the framework; they need
  only be aware of the interfaces to the components they specifically
  use. This avoids introducing a ubiquitous dependency upon the framework
  layer itself; it is plausible to modify or replace the framework
  without making changes to individual software components which run upon
  the framework.

A drawback to this approach is that it makes it difficult to define
"the architecture" of Open MCT Web, in terms of describing the specific
units that interact at run-time. The run-time architecture is determined
by the framework as the consequence of wiring together dependencies.
As such, the specific architecture of any given application built on
Open MCT Web can look very different.

Keeping that in mind, there are a few useful patterns supported by the
framework that are useful to keep in mind.

The specific service infrastructure provided by the platform is described
in the [Platform Architecture](Platform.md).

### Extension Categories

### Composite Services

Composite services (registered via extension category `components`) are
a pattern supported by the framework. These allow service instances to
be built from multiple components at run-time; support for this pattern
allows additional bundles to introduce or modify behavior associated
with these services without modifying or replacing original service
instances.

```nomnoml
#direction: down
[<abstract> FooService]
[FooDecorator #1]--:>[FooService]
[FooDecorator #n]--:>[FooService]
[FooAggregator]--:>[FooService]
[FooProvider #1]--:>[FooService]
[FooProvider #n]--:>[FooService]

[FooDecorator #1]o->[<state> ...decorators...]
[...decorators...]o->[FooDecorator #n]
[FooDecorator #n]o->[FooAggregator]
[FooAggregator]o->[FooProvider #1]
[FooAggregator]o->[<state> ...providers...]
[FooAggregator]o->[FooProvider #n]

[FooDecorator #1]--[<note> Exposed as fooService]
```

In this pattern, components all implement an interface which is
standardized for that service. Components additionally declare
that they belong to one of three types:

* __Providers.__ A provider actually implements the behavior
  (satisfies the contract) for that kind of service. For instance,
  if a service is responsible for looking up documents by an identifier,
  one provider may do so by querying a database, while another may
  do so by reading a static JSON document. From the outside, either
  provider would look the same (they expose the same interface) and
  they could be swapped out easily.
* __Aggregator.__ An aggregator takes many providers and makes them
  behave as one. Again, this implements the same interface as an
  individual provider, so users of the service do not need to be
  concerned about the difference between consulting many providers
  and consulting one. Continuing with the example of a service that
  looks up documents by identifiers, an aggregator here might consult
  all providers, and return any document is found (perhaps picking one
  over the other or merging documents if there are multiple matches.)
* __Decorators.__ A decorator exposes the same interface as other
  components, but instead of fully implementing the behavior associated
  with that kind of service, it only acts as an intermediary, delegating
  the actual behavior to a different component. Decorators may transform
  inputs or outputs, or initiate some side effects associated with a
  service. This is useful if certain common behavior associated with a
  service (caching, for instance) may be useful across many different
  implementations of that same service.

The framework will register extensions in this category such that an
aggregator will depend on all of its providers, and decorators will
depend upon on one another in a chain. The result of this compositing step
(the last decorator, if any; otherwise the aggregator, if any;
otherwise a single provider) will be exposed as a single service that
other extensions can acquire through dependency injection. Because all
components of the same type of service expose the same interface, users
of that service do not need to be aware that they are talking to an
aggregator or a provider, for instance.