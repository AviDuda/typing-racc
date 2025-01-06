# YNAB (You Need A Budget) plugin for TypingMind

> [!WARNING]
> This plugin is still work in progress and may not work properly.

Add [YNAB](https://ynab.com/) budget functionality in [TypingMind](https://www.typingmind.com/).

**IMPORTANT:** AI can and does hallucinate A LOT. It doesn't handle YNAB's [milliunits](https://api.ynab.com/#formats), so the numbers may be off for now.  
Also, turns out that AI is extremely bad at math. It can't even add up numbers correctly (may need to use eval or Simple Calculator plugin for that).

## Setup

### Install the plugin

1. Import the plugin.
    1. Open TypingMind and go to the *Plugins* page.
    1. Click on the *Import plugins* button.
    1. Paste the following URL: `https://github.com/AviDuda/typing-racc/tree/gh-pages/ynab`
    1. Press *Continue* and then *Import Plugin*.
1. Get the access token.
    1. Go to [YNAB developer settings](https://app.ynab.com/settings/developer).
    1. In the Personal Access Token section, click on the *New Token* button.
    1. Enter your password and click on the *Generate* button.
1. Set the access token.
    1. Go back to TypingMind and make sure you are on the *Plugins* page.
    1. Click on the YNAB plugin and paste the token into the *Access token* field.
    1. Click on the *Save* button.

## Development

### Updating the OpenAPI schema

From the root directory, run `bunx openapi-typescript https://api.ynab.com/papi/open_api_spec.yaml -o src/plugins/ynab/types/api.ts --root-types` to update the OpenAPI schema.
