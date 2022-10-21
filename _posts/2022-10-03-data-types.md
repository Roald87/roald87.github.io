---
layout: post
title: "TwinCAT datatypes in .NET"
category: twincat
---

When you're working with ADS, you often need to know the size of a data type or what a data type is called in your .NET language. I couldn't find the combined information, so I decided to make the overview myself.


| IEC61131-3 | System Manager | .NET type | C# | Visual Basic | Lower bound              | Upper bound             | Memory space  |
|------------|----------------|-------------------------|------------|----------------------|--------------------------|-------------------------|---------------|
|`BOOL`      |`BIT`           | `System.Boolean`          |`bool`       | `Boolean`              | 0 (`FALSE`)                | 1 (`TRUE`)                | 8 bit         |
|`BOOL`      |`BIT8`          | `System.Boolean`          | `bool`       | `Boolean`              | 0 (`FALSE`)                | 1 (`TRUE`)                | 8 bit         |
|`BYTE`      |`BITARR8`       | `System.Byte`             | `byte`       | `Byte`                 | 0                        | 255                     | 8 bit         |
|`WORD`      |`BITARR16`      | `System.UInt16`           | `ushort`     | -                    | 0                        | 65535                   | 16 bit        |
|`DWORD`     |`BITARR32`      | `System.UInt32`           | `uint`       | -                    | 0                        | 4.29e+09                | 32 bit        |
|`SINT`      |`INT8`          | `System.SByte`            | `sbyte`      | -                    | -128                     | 127                     | 8 bit         |
|`INT`       |`INT16`         | `System.Int16`            | `short`      | `Short`                | -32768                   | 32767                   | 16 bit        |
|`DINT`      |`INT32`         | `System.Int32`            | `int`        | `Integer`              | -2.1e+09                 | 2.15e+09                | 32 bit        |
|`LINT`      |`INT64`         | `System.Int64`            | `long`       | `Long`                 | -2e+63                   | 2e+63-1                 | 64 bit        |
|`USINT`     |`UINT8`         | `System.Byte`             | `byte`       | `Byte`                 | 0                        | 255                     | 8 bit         |
|`UINT`      |`UINT16`        | `System.UInt16`           | `ushort`     | -                    | 0                        | 65535                   | 16 bit        |
|`UDINT`     |`UINT32`        | `System.UInt32`           | `uint`       | -                    | 0                        | 4.29e+09                | 32 bit        |
|`ULINT`     |`UINT64`        | `System.UInt64`           | `ulong`      | -                    | 0                        | 2e+64-1                 | 64 bit        |
|`REAL`      |`FLOAT`         | `System.Single`           | `float`      | `Single`               | -3.40e+38                | 3.40e+38                | 32 bit        |
|`LREAL`     |`DOUBLE`        | `System.Double`           | `double`     | `Double`               | -1.798e+308 | 1.798e+308 | 64 bit        |

## Sources

- [BOOL](https://infosys.beckhoff.com/content/1033/tc3_plc_intro/2529394315.html?id=1768255288341275228)
- [INT](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/2529399691.html&id=)
- [REAL](https://infosys.beckhoff.com/english.php?content=../content/1033/tc3_plc_intro/2529399691.html&id=)
- [Data type comparison](https://infosys.beckhoff.com/content/1033/tc3_system/html/tcsysmgr_datatypecomparison.htm?id=3043404538898382042)
