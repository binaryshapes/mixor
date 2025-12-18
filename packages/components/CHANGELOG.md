# Changelog

## [1.2.0](https://github.com/binaryshapes/mixor/compare/components@v1.1.0...components@v1.2.0) (2025-12-18)


### ✨ Features

* **components/aggregate:** add isAggregate type guard and extend aggregate function ([a8ec234](https://github.com/binaryshapes/mixor/commit/a8ec234b3e27faf21187e179d1522f5d234be563))
* **components/aggregate:** add state inspection to createAggregate constructor ([5a5a59d](https://github.com/binaryshapes/mixor/commit/5a5a59da1c00a3c00f8a30980970d2f59e882a82))
* **components/aggregate:** change specs property visibility to public ([8984a0d](https://github.com/binaryshapes/mixor/commit/8984a0d3033821d9e12b225e0459d921a2dcf6bc))
* **components/aggregate:** enhance aggregate typing and expose pullEvents method ([303807f](https://github.com/binaryshapes/mixor/commit/303807fc3185fa2e099fdac5d07def69cccd4f68))
* **components/constants:** introduce STANDARD_SCHEMA_ERROR_MODE and update documentation ([cd247a0](https://github.com/binaryshapes/mixor/commit/cd247a0a03e5035b72797c5259ba88d68edad94d))
* **components/event:** refine event value handling in EventStore ([2dd3e47](https://github.com/binaryshapes/mixor/commit/2dd3e47908cbbcb78e98dc8fa7289be8e0fea2b5))
* **components/repository:** add exists method ([456fae4](https://github.com/binaryshapes/mixor/commit/456fae48a6fdaea76e55edead4aab97a5791da5c))
* **components/repository:** enhance repository type definitions for data source management ([78d078c](https://github.com/binaryshapes/mixor/commit/78d078c773a987cc5972d6781b6ad071d5e7cbfd))
* **components/repository:** implement createDataSource function for enhanced data source management ([117fba8](https://github.com/binaryshapes/mixor/commit/117fba87067c3088212c5d5a769bc71b0cffcef5))
* **components/rule:** enhance Rule component to support custom failure error classes ([5579b2a](https://github.com/binaryshapes/mixor/commit/5579b2a1cd569e26f7f411879741c67423f77d1d))
* **components/schema:** add JSON Schema conversion methods and define JsonSchema type ([e1dfce3](https://github.com/binaryshapes/mixor/commit/e1dfce3bedcd5d47620d5e1a9e13c19e08c2089c))
* **components/schema:** add validation for required schema keys ([2a7bff5](https://github.com/binaryshapes/mixor/commit/2a7bff5781991612e9bcb3dda8a03ba5d16db3f7))
* **components/schema:** extend error handling with custom issue properties ([b85aac7](https://github.com/binaryshapes/mixor/commit/b85aac75bffb6b640ae55a62522c02b393d7228a))
* **components/schema:** extend Schema type to include Errors type using DEFAULT_ERROR_MODE ([f987c5d](https://github.com/binaryshapes/mixor/commit/f987c5d09e5c827d75c38480159db97883462b89))
* **components/schema:** integrate Standard Schema support and enhance error handling ([34d6863](https://github.com/binaryshapes/mixor/commit/34d686373d3b0c15e8d1f552411e8b7a1f34b799))
* **components/task:** enhance task handler and fallback and add input/output schemas ([b6a3c3c](https://github.com/binaryshapes/mixor/commit/b6a3c3c795c28c53b6ed4b2f4a86f771c8cba12f))
* **components/task:** refine Task type definitions and remove isTask function ([70a3c74](https://github.com/binaryshapes/mixor/commit/70a3c74d1d98aa9016425ff49005f509a758dce5))
* **components/value:** enhance Value type with Errors property for improved error handling ([537207c](https://github.com/binaryshapes/mixor/commit/537207c5c34277df7eee36dd92e549fe6d4f3cd0))
* **components/workflow:** add input and output properties to WorkflowBuilder ([dbbde1d](https://github.com/binaryshapes/mixor/commit/dbbde1dc6d47c534c19e79f1a410dccae5189b59))
* **components/workflow:** add workflow component and task orchestration ([0115828](https://github.com/binaryshapes/mixor/commit/0115828c7dfdab6b49b2dfe044f8cca19f786653))
* **components/workflow:** refactor workflow execution and enhance type definitions ([8265f0b](https://github.com/binaryshapes/mixor/commit/8265f0bb929e388e26be5215f189e493c7aa89f6))
* **components:** add controller component for HTTP request handling ([f8c5232](https://github.com/binaryshapes/mixor/commit/f8c5232435a1aaa23c6e859a7f379384a0d89ba1))
* **components:** add criteria and repository components for enhanced data handling ([56b4fd1](https://github.com/binaryshapes/mixor/commit/56b4fd1a652c2f78a2411c9a6d0ccb9d82865a55))
* **components:** add specification component for entity validation ([3fc4a80](https://github.com/binaryshapes/mixor/commit/3fc4a808bc8336647e2ce4243f70fc9426884e03))
* **components:** enhance event manager with auto metadata and info doc ([5279475](https://github.com/binaryshapes/mixor/commit/5279475f76fda310390ec2c021e613365c70d0c9))
* **components:** introduce aggregate component for domain-driven design ([d1f8611](https://github.com/binaryshapes/mixor/commit/d1f861110c57ca491865fbaf41270dd1effb5fb9))
* **components:** introduce event and event manager components ([0ad661a](https://github.com/binaryshapes/mixor/commit/0ad661a2170cd72fa83f77071afa01805a0f56a1))
* **components:** introduce task component for asynchronous fault-tolerant functions ([62b74a0](https://github.com/binaryshapes/mixor/commit/62b74a0e045b7820799221a04a04614c5363ca9c))
* **components:** now aggregate acts as a provider in order to support ports and adapters ([ad8476e](https://github.com/binaryshapes/mixor/commit/ad8476e112958cb2087171aa9def735d727c4c1d))


### 🐛 Bug fixes

* **components/aggregate:** ensure correct adapter type handling in aggregate function ([b552e2b](https://github.com/binaryshapes/mixor/commit/b552e2b6cbb49f76ef923e9450a2574140659f80))
* **components/aggregate:** improve type inference for instance types ([22974ab](https://github.com/binaryshapes/mixor/commit/22974ab4fe8c58dfe3750dfa59a944ef2c91f027))
* **components/aggregate:** refine instance type inference for Aggregate component ([0b84118](https://github.com/binaryshapes/mixor/commit/0b84118072bdac4735273dc209ed97e3534d407c))
* **components/aggregate:** update state and constructor types ([2836255](https://github.com/binaryshapes/mixor/commit/2836255c306a09180e0c845d39ababc57a790f45))
* **components/event:** refine EventValue type definition for improved type inference ([d82c194](https://github.com/binaryshapes/mixor/commit/d82c19422c88512da1f25c5998514bcbf7cb9935))
* **components/repository:** add error handling for existing items in save method ([544df0f](https://github.com/binaryshapes/mixor/commit/544df0f01c280dea7daa74439d7dc17c76127dd7))
* **components/repository:** address type inference issues in save method ([a27e601](https://github.com/binaryshapes/mixor/commit/a27e6010314e226d535986c54f8439e0dc54925e))
* **components/repository:** update repository methods to be asynchronous ([f71f446](https://github.com/binaryshapes/mixor/commit/f71f446f5a941185dfbc32fb72c9d664dff24459))
* **components/schema:** conditionally set schema info type and parameters ([7fd9742](https://github.com/binaryshapes/mixor/commit/7fd9742f931c573d0577e892b66de1370ecbfba4))
* **components/schema:** enhance schema component uniqueness by including field names ([cdd8528](https://github.com/binaryshapes/mixor/commit/cdd8528a78941007758163e25e74e2f9ceb75056))
* **components/schema:** refine SchemaErrors type for improved error handling ([7b6374b](https://github.com/binaryshapes/mixor/commit/7b6374b4a039e31c328c0c5e53eb17b9c3734fd4))
* **components/task:** enhance provider panic error message for invalid deps ([f0a1f0a](https://github.com/binaryshapes/mixor/commit/f0a1f0a3e22a933a401d4732c58eae26e9cffd3c))
* **components/task:** include handler function in Provider definition for uniqueness ([974dd24](https://github.com/binaryshapes/mixor/commit/974dd241fad60228bfecf8669a4895f03e4e14b8))
* **components:** ensure ports are correctly defined in aggregate provider ([5e33548](https://github.com/binaryshapes/mixor/commit/5e33548bfeb35e33365d58c8a18ccf231c84bd22))


### 📚 Documentation

* **components/workflow:** simplify workflow doc by removing redundant task addition instructions ([2a7d5a6](https://github.com/binaryshapes/mixor/commit/2a7d5a634f8b3a3c2d92afaad550f69843ccabe7))


### 🔧 Miscellaneous chores

* **components:** add import for @standard-schema/spec version 1.0.0 ([40441e8](https://github.com/binaryshapes/mixor/commit/40441e8f79e359305fbd803be37c6785e19901d1))
* **components:** add imports section for async utilities in deno.json ([228c713](https://github.com/binaryshapes/mixor/commit/228c713f27b2a429ca805d589a358955697d71cb))


### 🔄 Code refactoring

* **components/aggregate:** improve static create return type for clarity ([7fe84ed](https://github.com/binaryshapes/mixor/commit/7fe84ede06da5627d40c98a8cc16703dfdea9c71))
* **components/aggregate:** simplify AggregateAdapters type definition ([d410ffa](https://github.com/binaryshapes/mixor/commit/d410ffaf5b17bed65800394912181d2382afd9a6))
* **components/aggregate:** simplify return value in createAggregate function ([282ba61](https://github.com/binaryshapes/mixor/commit/282ba6196c3b957fa378e05d4125ccbdf1d943cc))
* **components/event:** enhance Event type definition by including EventData ([fc27079](https://github.com/binaryshapes/mixor/commit/fc27079854ac3f7be9452ec2ed0021220e994262))
* **components/repository:** reorganize imports for improved clarity and structure ([b3e5f2e](https://github.com/binaryshapes/mixor/commit/b3e5f2ef55224c7069148600d183305fef53c7ac))
* **components/task:** enhance task component structure and error handling ([3206555](https://github.com/binaryshapes/mixor/commit/3206555d7f99be7904f329fdfae7a22b129a8adb))
* **components/task:** enhance task component types and structure ([9b47d7a](https://github.com/binaryshapes/mixor/commit/9b47d7ae3ea705bba264ebcea7097392de38e06b))
* **components/task:** enhance TaskContract and TaskBuilder types for improved clarity ([1706576](https://github.com/binaryshapes/mixor/commit/1706576c937bdb97630aa00ff47b2079692a7d13))
* **components/task:** enhance TaskDependencies type to accept Providers without deps ([f6cf96b](https://github.com/binaryshapes/mixor/commit/f6cf96bd4d8b5842a5f0216def01b765ab9a713b))
* **components/task:** simplify caller function assignment in TaskBuilder ([0a78262](https://github.com/binaryshapes/mixor/commit/0a78262c5635898979d1d80a436b329b78489b8f))
* **components/task:** simplify task provider building logic and enhance error handling ([5f3817d](https://github.com/binaryshapes/mixor/commit/5f3817d0730b8c07ebc93b45065cfc448d90589e))
* **components/task:** streamline task component types and enhance error handling ([07a9b57](https://github.com/binaryshapes/mixor/commit/07a9b571cf8abfe993a1f42c0e280bca31cec2f0))
* **components/task:** update Provider definition to directly use handler function ([b20fd01](https://github.com/binaryshapes/mixor/commit/b20fd01cb5942237c5487e823884071a9f52d68b))
* **components/workflow:** export WorkflowPanic alongside workflow ([93b2ee6](https://github.com/binaryshapes/mixor/commit/93b2ee6b3f864634bc2879323d4910cbafef6c49))
* **components:** remove deprecated types module ([33a19eb](https://github.com/binaryshapes/mixor/commit/33a19eb5346a742349fd2ec6bcf1f353840b7aa5))
* **components:** rename EnvError to EnvPanic and update related references ([b679fbf](https://github.com/binaryshapes/mixor/commit/b679fbfe28459550f6c351fb8a0c7bf4e4e7776f))

## [1.1.0](https://github.com/binaryshapes/mixor/compare/components@v1.0.0...components@v1.1.0) (2025-11-07)


### ✨ Features

* **components:** add constants and types ([dee867f](https://github.com/binaryshapes/mixor/commit/dee867f10065ccc996cea2e5fc9fef683a20c6c2))
* **components:** add env component for environment variable management ([d6a93a1](https://github.com/binaryshapes/mixor/commit/d6a93a126230dec7b034bf3a5823ccb10384efb3))
* **components:** add mod.ts for package exports ([f756472](https://github.com/binaryshapes/mixor/commit/f756472b88a084906b1f880f13053afa70385754))
* **components:** add rule and validator components ([92374e5](https://github.com/binaryshapes/mixor/commit/92374e55a2fea7464d930a74b355504e88d93cb4))
* **components:** add value component for input validation ([0a43e0b](https://github.com/binaryshapes/mixor/commit/0a43e0b8aaa0e9b0da90a04d4e4ad1deb3d0896e))
* **components:** convert function declarations to arrow functions for consistency ([ca4a144](https://github.com/binaryshapes/mixor/commit/ca4a144079a3385ea5d106473bde0dd7a00b4aa0))
* **components:** enhance schema component with reference handling ([9d688f2](https://github.com/binaryshapes/mixor/commit/9d688f2b0e3b0434f94e27dbc6e33c44fce551b7))
* **components:** enhance schema with builder functionality ([866756f](https://github.com/binaryshapes/mixor/commit/866756fbfb10394898523a0335355056ec38f269))
* **components:** enhance value component with builder improvements ([59e5a2e](https://github.com/binaryshapes/mixor/commit/59e5a2ec09a97abb21ba362856abdd9f8110d377))
* **components:** introduce components package ([5cd1d0a](https://github.com/binaryshapes/mixor/commit/5cd1d0a9d1f35b4fa8c1eabff00684804a87d371))
* **components:** introduce schema component for structured validation ([8d5a062](https://github.com/binaryshapes/mixor/commit/8d5a062581d6c6f49906bb540e2cbd5d3ed7a6fa))
* **components:** prevent overwriting type in value component ([a22b852](https://github.com/binaryshapes/mixor/commit/a22b852dc3949a19e509710d1005a498bf206f90))
* **components:** update default error mode for components ([b4e8331](https://github.com/binaryshapes/mixor/commit/b4e8331c4d050660a619d1be9ed14b18b2a83867))
* **components:** update validator reference in rule component ([cc8f968](https://github.com/binaryshapes/mixor/commit/cc8f968396ac9ce0bdee5863bd288b12e87e93e7))
* **components:** update value to use constant for type identification ([20956e7](https://github.com/binaryshapes/mixor/commit/20956e7b96b391643275740e2758c0a233175396))
* **components:** update visibility and documentation for schema types ([f52aa24](https://github.com/binaryshapes/mixor/commit/f52aa244410c33d781b122fa2d4a8cbf762976cc))
* **core:** add DEFAULT_VALUE_COERCE and enhance value coercion functionality ([9f64808](https://github.com/binaryshapes/mixor/commit/9f64808394a3f4bdb2e16c98364d5a2931c5fecc))


### 📚 Documentation

* **components:** improve documentation for Rule and Validator ([21d3bf7](https://github.com/binaryshapes/mixor/commit/21d3bf72c2a4e38289445bd5cb37bf14235ec9a9))


### 🔧 Miscellaneous chores

* downgrade package versions for core and components to v0.1.0 ([35a86e5](https://github.com/binaryshapes/mixor/commit/35a86e5816e2b5ce31725abb59cd65cd417c6cdf))
* restart workspace versions ([ffec73c](https://github.com/binaryshapes/mixor/commit/ffec73c997ab2ae0d206e5064c17dc9bbca57176))
* update deno.json files to include publish configuration and add LICENSE file ([7c4aa4a](https://github.com/binaryshapes/mixor/commit/7c4aa4a634df8c4a2146ada78cccb9e9f616b16b))
* update package version and clean deno.json files ([5c55abc](https://github.com/binaryshapes/mixor/commit/5c55abce2e8af56bfc957bcdb65fe70574c21237))
* update package versions to v0.2.0 and enhance deno.json configuration ([15afc35](https://github.com/binaryshapes/mixor/commit/15afc35c2fb375a54d92375667ca4e8ce820f929))
