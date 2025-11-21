# Changelog

## [1.2.0](https://github.com/binaryshapes/mixor/compare/components@v1.1.0...components@v1.2.0) (2025-11-21)


### ✨ Features

* **components/aggregate:** enhance aggregate typing and expose pullEvents method ([303807f](https://github.com/binaryshapes/mixor/commit/303807fc3185fa2e099fdac5d07def69cccd4f68))
* **components/schema:** extend Schema type to include Errors type using DEFAULT_ERROR_MODE ([f987c5d](https://github.com/binaryshapes/mixor/commit/f987c5d09e5c827d75c38480159db97883462b89))
* **components:** add criteria and repository components for enhanced data handling ([56b4fd1](https://github.com/binaryshapes/mixor/commit/56b4fd1a652c2f78a2411c9a6d0ccb9d82865a55))
* **components:** add specification component for entity validation ([3fc4a80](https://github.com/binaryshapes/mixor/commit/3fc4a808bc8336647e2ce4243f70fc9426884e03))
* **components:** enhance event manager with auto metadata and info doc ([5279475](https://github.com/binaryshapes/mixor/commit/5279475f76fda310390ec2c021e613365c70d0c9))
* **components:** introduce aggregate component for domain-driven design ([d1f8611](https://github.com/binaryshapes/mixor/commit/d1f861110c57ca491865fbaf41270dd1effb5fb9))
* **components:** introduce event and event manager components ([0ad661a](https://github.com/binaryshapes/mixor/commit/0ad661a2170cd72fa83f77071afa01805a0f56a1))
* **components:** introduce task component for asynchronous fault-tolerant functions ([62b74a0](https://github.com/binaryshapes/mixor/commit/62b74a0e045b7820799221a04a04614c5363ca9c))
* **components:** now aggregate acts as a provider in order to support ports and adapters ([ad8476e](https://github.com/binaryshapes/mixor/commit/ad8476e112958cb2087171aa9def735d727c4c1d))


### 🐛 Bug fixes

* **components:** ensure ports are correctly defined in aggregate provider ([5e33548](https://github.com/binaryshapes/mixor/commit/5e33548bfeb35e33365d58c8a18ccf231c84bd22))


### 🔧 Miscellaneous chores

* **components:** add imports section for async utilities in deno.json ([228c713](https://github.com/binaryshapes/mixor/commit/228c713f27b2a429ca805d589a358955697d71cb))


### 🔄 Code refactoring

* **components/task:** enhance task component structure and error handling ([3206555](https://github.com/binaryshapes/mixor/commit/3206555d7f99be7904f329fdfae7a22b129a8adb))
* **components/task:** enhance task component types and structure ([9b47d7a](https://github.com/binaryshapes/mixor/commit/9b47d7ae3ea705bba264ebcea7097392de38e06b))
* **components/task:** simplify task provider building logic and enhance error handling ([5f3817d](https://github.com/binaryshapes/mixor/commit/5f3817d0730b8c07ebc93b45065cfc448d90589e))
* **components/task:** streamline task component types and enhance error handling ([07a9b57](https://github.com/binaryshapes/mixor/commit/07a9b571cf8abfe993a1f42c0e280bca31cec2f0))
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
