# Changelog

## [1.3.0](https://github.com/binaryshapes/mixor/compare/core@v1.2.0...core@v1.3.0) (2025-12-18)


### ✨ Features

* **core/config:** add NUXO_DEBUG variable to enable debug mode ([761346e](https://github.com/binaryshapes/mixor/commit/761346e1fc7c9153a3b3484c386d0f10923d5636))
* **core/container:** add isProvider type guard to public core API ([3f4a41c](https://github.com/binaryshapes/mixor/commit/3f4a41cee55506e4166e066f6d38b02dd8b44b08))
* **core/container:** enhance contract and implementation types with error handling ([a12bc20](https://github.com/binaryshapes/mixor/commit/a12bc2016879c37d0d84f7c248c566d466e1bf1a))
* **core/container:** enhance ProviderBuilder with improved type definitions ([da5b715](https://github.com/binaryshapes/mixor/commit/da5b715b8359ee08741fcb411a53bea47b7e759a))
* **core/container:** enhance ProviderBuilder with uniqueness parameter and refactor build logic ([aea5ea1](https://github.com/binaryshapes/mixor/commit/aea5ea11ca6630ad32f86206dfcb17a2bb7822ee))
* **core/container:** refine type definitions and improve provider handling ([4f11742](https://github.com/binaryshapes/mixor/commit/4f11742d26a7d9fc5a5b35fbb1e2c46da3d5c028))
* **core/failure:** introduce failure component for error handling ([09fc834](https://github.com/binaryshapes/mixor/commit/09fc834647a132e97c530c1fa49b9587cb9bf893))
* **core/generics:** add FilterEmptyObjects type for improved type filtering ([88ec35b](https://github.com/binaryshapes/mixor/commit/88ec35bfb6a3bec5117d686e5d467ec06c834972))
* **core/generics:** add new generic utilities ([204c7b5](https://github.com/binaryshapes/mixor/commit/204c7b5d58e13e635fde0644ac92b4b03b5a0d76))
* **core/generics:** add new generics utils for merge objects ([b179b8d](https://github.com/binaryshapes/mixor/commit/b179b8d1662433040815c965bf0b1a4186ba9661))
* **core/generics:** add utility generics for Record types ([bb50684](https://github.com/binaryshapes/mixor/commit/bb506846022939e09c7b98afb23037c097a4c701))
* **core/generics:** introduce Opaque and InstanceClass types for enhanced type safety in classes ([b364261](https://github.com/binaryshapes/mixor/commit/b3642611d1deb37a4f90eb17f7908d7ff5559983))
* **core/i18n:** implement internationalization support with language configuration ([bba3c83](https://github.com/binaryshapes/mixor/commit/bba3c833e84e1d299d00afa456a538a9ab47d50e))
* **core/logger:** enhance debug logging with configuration support ([bf71d84](https://github.com/binaryshapes/mixor/commit/bf71d8439698c3e6776691d79536a9bc3aa1d8fe))
* **core/panic:** export missed PanicError class ([5e1cff2](https://github.com/binaryshapes/mixor/commit/5e1cff2dd38fe25562e6f5c1f2443caed4c0c6b8))
* **core/utils:** enhance target inspection with toJSON method ([189d304](https://github.com/binaryshapes/mixor/commit/189d3048d77f8c65e74adfff5e90f124a2b8c31b))


### 🐛 Bug fixes

* **components/task:** enhance provider panic error message for invalid deps ([f0a1f0a](https://github.com/binaryshapes/mixor/commit/f0a1f0a3e22a933a401d4732c58eae26e9cffd3c))
* **core/config:** correct NUXO_DEBUG assignment syntax ([5a72450](https://github.com/binaryshapes/mixor/commit/5a724500eb3a6bca145e09a7ffc3ec30250cd222))
* **core/container:** allow to contract have no input params and resolve container registration issue ([4f5089c](https://github.com/binaryshapes/mixor/commit/4f5089c4d9d7ac0bedb9e51fd9f1238c1c0c8021))
* **core/container:** change visibility of imports and bindings to private in container builder ([ae3c6b4](https://github.com/binaryshapes/mixor/commit/ae3c6b473417c34e6d5d538980e24a0f18eb27e4))
* **core/container:** enhance contract input/output validation and types ([dac9675](https://github.com/binaryshapes/mixor/commit/dac96759eeab5a0f65de50e127b3b3034797fa50))
* **core/container:** enhance contract types and refine error strings ([e9e3dbb](https://github.com/binaryshapes/mixor/commit/e9e3dbb068d5e33353c57ba02e3651d4e1933cee))
* **core/container:** enhance type inference for ContractParams and ContractReturn ([9df948f](https://github.com/binaryshapes/mixor/commit/9df948f606e4d5177559fb552cd23bc11c531729))
* **core/container:** improve error logging and provider component creation ([f79aa41](https://github.com/binaryshapes/mixor/commit/f79aa416c230698b5ce98ef986e982761e0178e0))
* **core/container:** refine type inference for ContractParams ([6ae0a17](https://github.com/binaryshapes/mixor/commit/6ae0a17d036c3a5fbe9abc00977207bc02251682))
* **core/container:** solve type definitions and port binding logic ([b9f9adb](https://github.com/binaryshapes/mixor/commit/b9f9adbeaa9416f4bfc82e91767a49b617098eb8))
* **core/data:** return redacted value in Data class get method ([2497c3b](https://github.com/binaryshapes/mixor/commit/2497c3b8dbf85f333bf6fafcc2a502350bd261fb))
* **core/flow:** update bind and action method type definitions to improve error handling ([e52f111](https://github.com/binaryshapes/mixor/commit/e52f11199599457c78c7674551cd8ae91da7d74a))
* **core/panic:** correct error message formatting in PanicError constructor ([bd71df5](https://github.com/binaryshapes/mixor/commit/bd71df51a558c8f07c5debcdc425cb09f10cfeff))
* **core/panic:** enhance error logging based on NUXO_DEBUG configuration ([3dcbc3a](https://github.com/binaryshapes/mixor/commit/3dcbc3a77cb5fb72fc5d7744957c82083989bed1))
* **core/registry:** solve target handling with proxy for metaId ([dbe53dd](https://github.com/binaryshapes/mixor/commit/dbe53dd2950def72a81bc3d313fdbe3cfc8901b1))
* **core/registry:** update target property exposure to prevent private data leakage ([5c301d1](https://github.com/binaryshapes/mixor/commit/5c301d1a7c509e30c97f3d49dbf74599c40b154e))
* **core/result:** enhance assert function type definitions using ResultError ([d246aa6](https://github.com/binaryshapes/mixor/commit/d246aa61a5fe0836a19ae42c031db6ea9528bdd5))
* **core/result:** enhance error typing for better inference ([ebedad2](https://github.com/binaryshapes/mixor/commit/ebedad2957426293101373b933891048582cca29))


### 🔄 Code refactoring

* **core/config:** transform configuration variables into a class-based manager ([8878b33](https://github.com/binaryshapes/mixor/commit/8878b334774267f226b7c81e784e57f3e5ac2e84))
* **core/container:** adjust default type parameter in provider function ([7e43fb2](https://github.com/binaryshapes/mixor/commit/7e43fb284397d8c7532b972faed08dddff82ce5e))
* **core/container:** enhance ContainerPorts type definitions adding support for empty deps ([ded3563](https://github.com/binaryshapes/mixor/commit/ded35633777cd4f5deb7c7558641e899d09d1e0e))
* **core/container:** enhance contract and implementation types with detailed error handling ([d65e03f](https://github.com/binaryshapes/mixor/commit/d65e03f4626078836b1ec2431a4d282bafb60e64))
* **core/container:** enhance type definitions and error handling in Implementations and Ports ([ba99c3d](https://github.com/binaryshapes/mixor/commit/ba99c3d678fb8b9236037251371664811f45cc85))
* **core/container:** improve error handling in contract implementation ([6860e06](https://github.com/binaryshapes/mixor/commit/6860e06efe7078bd2052a5114584c32e35a613d2))
* **core/container:** refine ProviderSignature and provider function signatures ([7c029ce](https://github.com/binaryshapes/mixor/commit/7c029ce043a3a917a30f96c981a47168cdbce129))
* **core/container:** update error key visibility from internal to public ([c46ff7b](https://github.com/binaryshapes/mixor/commit/c46ff7bd6399df22e82d06a04dd5d5ebc0dcaed9))
* **core/container:** update implementation function signature ([27a0764](https://github.com/binaryshapes/mixor/commit/27a07642dbe62c1fa9952097678a3a5b135b8bf1))
* **core/flow:** enhance FlowReturnType to utilize MergeUnion for error handling ([6f658af](https://github.com/binaryshapes/mixor/commit/6f658afcfe7ca6bc8381a88be5c6bf4451a92345))
* **core/flow:** workaround to avoid expand classes in a flow ([b4769c0](https://github.com/binaryshapes/mixor/commit/b4769c04d1f8b547b6579b6be360162d953d9e81))
* **core/generics:** update Promisify type for improved async handling ([aeb1659](https://github.com/binaryshapes/mixor/commit/aeb16596e62d262f418099d9eefd9d5fece76819))
* **core/registry:** remove export method from Registry class ([9d9290b](https://github.com/binaryshapes/mixor/commit/9d9290b6be3f68cc817dc9533ebf7becfc8648b5))
* **core/result:** adjust default type parameter in ok function ([51a7548](https://github.com/binaryshapes/mixor/commit/51a7548b70510335b9850e92dbe3c6c8424a39d1))

## [1.2.0](https://github.com/binaryshapes/mixor/compare/core@v1.1.0...core@v1.2.0) (2025-11-07)


### ✨ Features

* **core:** add assert logging mode to logger ([a1017eb](https://github.com/binaryshapes/mixor/commit/a1017ebfb6c53a4de807e0c7205ccb84c54ebe88))
* **core:** add coercion functionality to Data class ([dfd3791](https://github.com/binaryshapes/mixor/commit/dfd3791f866053037f6da4559167d7d9e7f6019b))
* **core:** enhance logging error message in panic module ([39d9f7b](https://github.com/binaryshapes/mixor/commit/39d9f7be519bb08cb222bd94999f3e0da1cf4c13))

## [1.1.0](https://github.com/binaryshapes/mixor/compare/core@v1.0.0...core@v1.1.0) (2025-11-06)


### ✨ Features

* **container:** add circular dependency detection and improve error handling ([9ae18f8](https://github.com/binaryshapes/mixor/commit/9ae18f826e2758a4aa32ad4364a71354e8ab2120))
* **core:** add component system for metadata management ([a7668dd](https://github.com/binaryshapes/mixor/commit/a7668dd904dc9d6aba41fed3088525c01191fac2))
* **core:** add core configuration module ([468a70e](https://github.com/binaryshapes/mixor/commit/468a70ec1b3507a2945960b0d6a1ca543123d8d7))
* **core:** add core module and enhance exports ([e3f86ec](https://github.com/binaryshapes/mixor/commit/e3f86ec768a232452e4cddb0705f448173faa559))
* **core:** add core types module ([876cce2](https://github.com/binaryshapes/mixor/commit/876cce210db2221c89f9f649df7c3d081abbf611))
* **core:** add doc utility for formatted multi-line strings ([f6eeb08](https://github.com/binaryshapes/mixor/commit/f6eeb08e700b8eb99b25846fef95f090d9f299ef))
* **core:** add generics utility types for improved type handling ([9f94705](https://github.com/binaryshapes/mixor/commit/9f947055f99253419ee7c45199c5761e0e58c462))
* **core:** add isPrimitive utility function for type checking ([f1b1f7c](https://github.com/binaryshapes/mixor/commit/f1b1f7caff82944b8e221c03751d5ef6c97175b9))
* **core:** add logger module for enhanced console messaging ([9eae50b](https://github.com/binaryshapes/mixor/commit/9eae50b16f2742b8ca5510d6dbf802ac1aa48963))
* **core:** add panic inner class name for type clarity ([36119e7](https://github.com/binaryshapes/mixor/commit/36119e748a21df5449913061493c63de7db78c40))
* **core:** add panic module for handling unrecoverable runtime errors ([4236a7d](https://github.com/binaryshapes/mixor/commit/4236a7d7a2206ef224fb14f76d5164445c529976))
* **core:** add pipe function for functional composition ([2a4e16d](https://github.com/binaryshapes/mixor/commit/2a4e16d35d6a01b120bae4e8f30c470ed7d524e1))
* **core:** add RequireAtLeastOne generic utility type ([53f674a](https://github.com/binaryshapes/mixor/commit/53f674a1241186e15569da28503862b6d2316cc3))
* **core:** add UnionToIntersection type for object type conversion ([3322f85](https://github.com/binaryshapes/mixor/commit/3322f855951dd087ab277bd9f841ee8af90feec1))
* **core:** add utility functions for enhanced object manipulation ([d7003d5](https://github.com/binaryshapes/mixor/commit/d7003d5a04670ec195bf2669fec0f0b37cc1579b))
* **core:** enhance container and provider functionality ([0b7c5bc](https://github.com/binaryshapes/mixor/commit/0b7c5bcf6d5cc2be65decd01a088bcbc731721f8))
* **core:** enhance container with contracts, ports and adapters ([39fda11](https://github.com/binaryshapes/mixor/commit/39fda114450ba42507a159a5d414c4657649a90f))
* **core:** enhance error handling in pipe and result functions ([a241c1d](https://github.com/binaryshapes/mixor/commit/a241c1d5b99433211f4da5ce8d0ab79ce4eaa112))
* **core:** enhance inspect functionality for custom objects ([72f990b](https://github.com/binaryshapes/mixor/commit/72f990bbe44d7870116713584ab2dce4f0728186))
* **core:** enhance logger with hint and apply to panic ([89e624a](https://github.com/binaryshapes/mixor/commit/89e624a6ef0555ff8983af69126db03d11007923))
* **core:** enhance merge functionality in registry ([e2ff304](https://github.com/binaryshapes/mixor/commit/e2ff304148c1ae487ec213a615439806c1381e62))
* **core:** enhance provider types and builder functionality ([00ee9a8](https://github.com/binaryshapes/mixor/commit/00ee9a8506f45dca03020593ab184518350cd7df))
* **core:** enhance registry system ([81ae79e](https://github.com/binaryshapes/mixor/commit/81ae79e5357e2c1a5f46ccbdafbdfcc3b320621c))
* **core:** enhance some type annotations in order to avoid slow types ([84cbed3](https://github.com/binaryshapes/mixor/commit/84cbed35d92d06933cd2fbdb263bda2af1c6104a))
* **core:** enhance type annotations for logger functions ([cc77e41](https://github.com/binaryshapes/mixor/commit/cc77e416fbe6816d2bab2e09446950db1ff74c25))
* **core:** enhance type assignment logic in registry ([871822b](https://github.com/binaryshapes/mixor/commit/871822bac4ec6abe87f0c36cf8f40f86a8d1389f))
* **core:** implement flow module for composable data processing ([df9ceea](https://github.com/binaryshapes/mixor/commit/df9ceeae0fa4a5aafce3f01cb080e1062ebdcbe9))
* **core:** implement Result type for enhanced error handling ([96c7c3b](https://github.com/binaryshapes/mixor/commit/96c7c3bbbc748563045daff2b8c0b07596ba41a8))
* **core:** improve hash function stringification logic ([3a96838](https://github.com/binaryshapes/mixor/commit/3a968380ceebf60c33543270708544a710d49407))
* **core:** improve metaId assignment in already registered object ([ad30f0d](https://github.com/binaryshapes/mixor/commit/ad30f0d10de8029bb5c902c300e47e8e033c8f96))
* **core:** introduce Data container for secure data handling ([113a262](https://github.com/binaryshapes/mixor/commit/113a262e44d9676e88d95bcdd561a717476b573b))
* **core:** introduce dependency injection container module ([f7680c1](https://github.com/binaryshapes/mixor/commit/f7680c14ac1171bb9870b6d249cee2f3a6390cfe))
* **core:** introduce Pretty type for enhanced type readability ([56a715f](https://github.com/binaryshapes/mixor/commit/56a715f7db3561e80ba84eefa29398e287648247))
* **core:** refine error type handling in result module ([99919eb](https://github.com/binaryshapes/mixor/commit/99919ebf80f4fae657a85db283fa7a579bd95032))
* **core:** refine hash function and isPrimitive utility ([5f71317](https://github.com/binaryshapes/mixor/commit/5f71317601951f36841148ebbab75cd672ee0a11))
* **core:** refine Info type handling in registry ([ddcd763](https://github.com/binaryshapes/mixor/commit/ddcd763383ff8f674e91988ab3196c5046892d0d))
* **core:** refine UndefToOptional type for improved clarity and order ([d16f762](https://github.com/binaryshapes/mixor/commit/d16f76282e960e54f54d9d879b870a62c7269b0f))
* **core:** rename generics utility to be part of the public API ([3be4296](https://github.com/binaryshapes/mixor/commit/3be429638eba9ebb615c82a80eed26667f673b88))
* **core:** rename Logger to logger for API consistency ([5418cde](https://github.com/binaryshapes/mixor/commit/5418cde527a3401e98b326f122c59a29f1503e00))
* **core:** simplify export syntax for core package ([4b8351f](https://github.com/binaryshapes/mixor/commit/4b8351f6051d04a6a13d18f453d35182fe65999a))
* **core:** update registry export method to use Deno API ([8a7f040](https://github.com/binaryshapes/mixor/commit/8a7f040434634fcf4aa7a1395991bc4b6e0d5008))
* **core:** update registry record name formatting ([1037060](https://github.com/binaryshapes/mixor/commit/1037060c103ef29443cd9142d004269d36477af8))


### 🐛 Bug fixes

* **core:** enhance type annotations in Data class ([f122761](https://github.com/binaryshapes/mixor/commit/f1227616cd12cbcd2bc5be6818ecfebc78412f44))
* **core:** improve type annotations in flow module ([6f95dcf](https://github.com/binaryshapes/mixor/commit/6f95dcfa752dc5c7934aaed3c53ab2d328ee5329))


### 🔧 Miscellaneous chores

* add README for Nuxo Core package ([e1a7934](https://github.com/binaryshapes/mixor/commit/e1a79341448a372e8cd5019b19d4015eab1028d6))
* downgrade package versions for core and components to v0.1.0 ([35a86e5](https://github.com/binaryshapes/mixor/commit/35a86e5816e2b5ce31725abb59cd65cd417c6cdf))
* fix some issues in publish workflow and reset versions ([994bf44](https://github.com/binaryshapes/mixor/commit/994bf44563e619975584604e6d1f1d25b901836b))
* restart release configs ([8525dde](https://github.com/binaryshapes/mixor/commit/8525ddefbf0668f7d4abb953b0f47fd7155ab819))
* restart workspace versions ([ffec73c](https://github.com/binaryshapes/mixor/commit/ffec73c997ab2ae0d206e5064c17dc9bbca57176))
* update deno.json configuration ([b0952e2](https://github.com/binaryshapes/mixor/commit/b0952e298a7bbdc6d2a65a8672e05c346627b51c))
* update deno.json files to include publish configuration and add LICENSE file ([7c4aa4a](https://github.com/binaryshapes/mixor/commit/7c4aa4a634df8c4a2146ada78cccb9e9f616b16b))
* update deno.json to include mod.ts in publish configuration ([785835b](https://github.com/binaryshapes/mixor/commit/785835b9482cc8b67fc22a57eb47bd596dd23961))
* update dev task to allow write permissions ([c28c13c](https://github.com/binaryshapes/mixor/commit/c28c13c9e94d35df2efe7d19bf540f5952997d05))
* update package version and clean deno.json files ([5c55abc](https://github.com/binaryshapes/mixor/commit/5c55abce2e8af56bfc957bcdb65fe70574c21237))
* update package versions to v0.2.0 and enhance deno.json configuration ([15afc35](https://github.com/binaryshapes/mixor/commit/15afc35c2fb375a54d92375667ca4e8ce820f929))
* update release config ([f6db07b](https://github.com/binaryshapes/mixor/commit/f6db07beebe767b2e6534b276ed7b23a72e538e8))


### 🔄 Code refactoring

* **core:** rename utility function for clarity ([87f5994](https://github.com/binaryshapes/mixor/commit/87f599400f4c4dc48d733d256d402c770830332d))
* **core:** update type in isRegistered function ([639a4a3](https://github.com/binaryshapes/mixor/commit/639a4a3e0954f07c34341338d0caa96d42681ffe))
* correct import path for generics module ([54a0fcb](https://github.com/binaryshapes/mixor/commit/54a0fcbf06775411e8607c453f355a9d3822f953))


### 🧪 Tests

* **core:** introduce tests for pipe ([649ef11](https://github.com/binaryshapes/mixor/commit/649ef118d3d0acd1e8075734d332dd15b4440c40))
