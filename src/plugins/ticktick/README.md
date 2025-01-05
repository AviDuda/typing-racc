# TickTick plugin for TypingMind

Add [TickTick](https://ticktick.com/) task manager functionality in [TypingMind](https://www.typingmind.com/).

**IMPORTANT:** AI can and does hallucinate. It doesn't understand the structure well and may lie to you about the tasks (e.g. not including all even though they were returned in the response). Use the agent for better results.

## Setup

### Install the plugin

1. Import the plugin.
    1. Open TypingMind and go to the *Plugins* page.
    1. Click on the *Import plugins* button.
    1. Paste the following URL: `https://github.com/AviDuda/typingmind-plugins/tree/gh-pages/ticktick`
    1. Press *Continue*.
1. Create a new app on the [TickTick developer page](https://developer.ticktick.com/manage).
    1. Click on New App, add a name (e.g. TypingMind), and confirm with the Add button.
    1. On the edit page, set *OAuth redirect URL* to `http://localhost/oauth/callback` and save.
    1. Copy the *Client ID*.
1. Get the access key.
    1. Open the following URL in your browser: `https://ticktick.com/oauth/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost/oauth/callback`.  
      Replace `YOUR_CLIENT_ID` with the client ID from the TickTick developer page.
    1. Log in to your TickTick account and confirm the authorization.
    1. The browser will redirect you to a (probably non-existing) page. Copy the code from the URL in the address bar (e.g. `http://localhost/oauth/callback?code=COPY_THIS_CODE`).
1. Set the access key.
    1. Go back to TypingMind and make sure you are on the *Plugins* page.
    1. Click on the TickTick plugin and paste the code into the *Access key* field.
    1. Click on the *Save* button.

You don't need to enable the plugin. It will be automatically enabled if you use the agent (highly recommended).

### Install the agent

1. Download the [agent JSON file](https://raw.githubusercontent.com/AviDuda/typingmind-plugins/gh-pages/ticktick/agent.json).
1. Import the agent.
    1. Open TypingMind and go to the *Agents* page.
    1. Click on the arrow next to the *Create AI Agent* button and select *Import from JSON*.
    1. Select the downloaded file and press *Open*.

## Usage

It is recommended to use the agent with the plugin. The agent can understand the tasks better, provide more accurate results, and act as a safeguard against AI hallucinations.

1. Open TypingMind.
2. Start a new conversation with the agent, or add the agent to an existing conversation via `@TickTick`.
