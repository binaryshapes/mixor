# Changelog

## 1.0.0 (2025-12-18)


### ✨ Features

* **values:** add additional string rules for Base64, Capitalized, Contains, CUID, and CUID2 ([748f8f6](https://github.com/binaryshapes/mixor/commit/748f8f6940c42a3998768f48856f6ed1b06df2a8))
* **values:** add additional string rules for duration, email, emoji, ends-with, and GUID ([3b3e2f5](https://github.com/binaryshapes/mixor/commit/3b3e2f5ea8ecf97d14ea11c3a5cbd3c644412094))
* **values:** add Alpha and Alphanumeric validation rules for string values ([84c1d1a](https://github.com/binaryshapes/mixor/commit/84c1d1a173b1e0f905c20edbfd017305659e9dff))
* **values:** add enumerate functionality for value validation ([accd15f](https://github.com/binaryshapes/mixor/commit/accd15fdf02c6f840bf60fe47e96f048ede5dfff))
* **values:** add info for boolean, number, enumerate and string value  components ([1ebce7f](https://github.com/binaryshapes/mixor/commit/1ebce7f02af56433bd9b24c1e3b8f6bcb7208629))
* **values:** add MaxLength, MinLength, and rename NotEmpty rules for string validation ([cd77433](https://github.com/binaryshapes/mixor/commit/cd77433fe53266405b6546dbec803d34e5cee773))
* **values:** add NotEmptyString rule for string values ([4b3231e](https://github.com/binaryshapes/mixor/commit/4b3231ec9bf0eab1df27467bbbf4d45a4e6a14a0))
* **values:** add rules for hexadecimal, IP range, IPv4, and IPv6 strings ([7fe8b52](https://github.com/binaryshapes/mixor/commit/7fe8b528abd989d25a78809f8acbec53d94eaeb8))
* **values:** add string rules for hash, RGB, RGBA, slug, starts-with, ULID, UUID, and XID ([1a24ce7](https://github.com/binaryshapes/mixor/commit/1a24ce79cf48e263f802c43be852526a1021bbed))
* **values:** add string rules for ISO date, datetime, time, JWT, KSUID, and lowercase strings ([6e788d0](https://github.com/binaryshapes/mixor/commit/6e788d04eb364e0f37f6e2e910a931ad3fd9ec8e))
* **values:** add string rules for MAC addresses, regex matches, NanoID, and phone numbers ([85d857e](https://github.com/binaryshapes/mixor/commit/85d857e51da4132071ef7d86105ba1d2c2252c05))
* **values:** add string rules for numbers, booleans, email domain, special characters and cases ([c53407a](https://github.com/binaryshapes/mixor/commit/c53407a3794c2bd1fcf23aa39968ecf61215e892))
* **values:** initialize values package with basic structure ([3124141](https://github.com/binaryshapes/mixor/commit/31241419eb8e980aaec84c3499b226e8766ca637))
* **values:** introduce a set of rules for number values ([710b89c](https://github.com/binaryshapes/mixor/commit/710b89cdb93903f2e45b9a2b8ea68939518dea27))


### 🐛 Bug fixes

* **values/enumerate:** update EnumRule type definition to include allowed values ([a06b894](https://github.com/binaryshapes/mixor/commit/a06b894aa45c632059442b128a9697a5e466c169))
* **values:** change info.doc set condition for boolean, number, and string values ([4feb6b6](https://github.com/binaryshapes/mixor/commit/4feb6b67add2c50e13eca714acc166467495180b))
* **values:** enhance IPv6 regex validation ([eaebf5b](https://github.com/binaryshapes/mixor/commit/eaebf5bd5ed34c50d8cb01f761fe8476bd014e1f))


### 🔄 Code refactoring

* **values:** rename EnumerateError to EnumeratePanic for improved clarity ([68ae780](https://github.com/binaryshapes/mixor/commit/68ae780d268788f497238b9bc0437afd7787462c))
* **values:** update boolean, number, and string values to use function overloading ([8083eb0](https://github.com/binaryshapes/mixor/commit/8083eb0d9d08ac9080e4934e995057752a085343))
