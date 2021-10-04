# deep-waifu-server

This is a part of the [DeepWaifu](https://blog.chronologic.network/no-waifu-no-laifu-we-use-deep-networks-to-draw-your-anime-style-portrait-5fbb0ee6b16a) project.

This repository holds the server code that handles the following responsibilities:

- proxy requests for converting selfies into waifus
- mint waifus as NFTs
- handle pillow purchases

The live version of the dapp can be found [here](https://deepwaifu.chronologic.network/).

## 🗺 Project overview

This project consists of the following repositories:

- https://github.com/chronologic/deep-waifu-ui
- https://github.com/chronologic/deep-waifu-server (this repository)
- https://github.com/chronologic/deep-waifu-payment-contract
- https://github.com/chronologic/deep-waifu-model

## 🔧 Environment variables

This repo uses [`dotenv`](https://www.npmjs.com/package/dotenv) to load environment variables.

For development, an `.env` file should be created based on the `.env.example` template file. The `.env` file should never be commited.

In production, environment variables can be injected directly.

Below is a list of possible environment variables.

| Name                           | Type       | Default | Description                                                                                                                                                    |
| ------------------------------ | ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LOG_LEVEL`                    | `string`   | `info`  | Standard [`npm`](https://github.com/winstonjs/winston#logging-levels) log level                                                                                |
| `PORT`                         | `number`   | `1337`  | Port at which the server should be listening                                                                                                                   |
| `SELF_URL`                     | `string`   |         | Public URL to this server. This is used for constructing a redirect after purchasing a pillow.                                                                 |
| `UI_URL`                       | `string`   |         | URL of [DeepWaifu UI](https://github.com/chronologic/deep-waifu-ui)                                                                                            |
| `MODEL_URL`                    | `string`   |         | URL of [DeepWaifu AI Model](https://github.com/chronologic/deep-waifu-model)                                                                                   |
| `SOLANA_ENV`                   | `string`   |         | Solana network the server should connect to [`devnet`/`testnet`/...)                                                                                           |
| `PAYMENT_PROGRAM_ID`           | `string`   |         | Public key of [DeepWaifu Payment Contract](https://github.com/chronologic/deep-waifu-payment-contract)                                                         |
| `CANDY_MACHINE_CONFIG_UUID`    | `string`   |         | [Metaplex Candy Machine](https://hackmd.io/@levicook/HJcDneEWF) config UUID.                                                                                   |
| `CANDY_MACHINE_CONFIG_ADDRESS` | `string`   |         | [Metaplex Candy Machine](https://hackmd.io/@levicook/HJcDneEWF) config address.                                                                                |
| `METAPLEX_CANDY_MACHINE_ID`    | `string`   |         | [Metaplex Candy Machine](https://hackmd.io/@levicook/HJcDneEWF) ID.                                                                                            |
| `WALLET_PK`                    | `number[]` |         | Solana wallet private key. This wallet will be used for creating the [Metaplex Candy Machine](https://hackmd.io/@levicook/HJcDneEWF) and for minting the NFTs. |
| `CREATOR_ADDRESS`              | `string`   |         | Public key of wallet that will be entitled to royalties from trading the minted NFTs.                                                                          |
| `STRIPE_PUBLIC_KEY`            | `string`   |         | Public API key for [Stripe](https://stripe.com/docs/api/authentication) payment service. This is used in the pillow purchase flow.                             |
| `STRIPE_SECRET_KEY`            | `string`   |         | Secret API key for [Stripe](https://stripe.com/docs/api/authentication) payment service. This is used in the pillow purchase flow.                             |
| `PILLOW_PRICE_USD`             | `number`   |         | The price of the pillow in USD.                                                                                                                                |
| `IMGBB_KEY`                    | `string`   |         | API key for [imgbb](https://api.imgbb.com/) image storage service. This is used for temporary storage of images in the pillow purchase flow.                   |
| `PRINTFUL_KEY`                 | `string`   |         | API key for [Printful](https://www.printful.com/api) on-demand printing service. This is used for the pillow purchase flow.                                    |

## 💽 Installation

Run `npm install`

## 🍬 Metaplex Candy Machine Setup

To create and initialize the [Metaplex Candy Machine](https://hackmd.io/@levicook/HJcDneEWF) run

`npm run metaplexBootstrap`

You must ensure you have at least 5 SOL in your wallet to cover the deployment cost. Once the process has finished, it will save create a file called `candyMachine_<candy_machine_id>.json` with all relevant addresses in the main directory. You can then put those in the `.env` file.

## 🚧 Building

Run `npm run build`

## 👷 Development

Run `npm run dev`
