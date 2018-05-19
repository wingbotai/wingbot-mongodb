# MongoDB plugin for wingbot.ai

Contains storage for tokens, chat states, bot config and chat logs.

-----------------

# API
## Classes

<dl>
<dt><a href="#StateStorage">StateStorage</a></dt>
<dd><p>Storage for chat states</p>
</dd>
<dt><a href="#BotTokenStorage">BotTokenStorage</a></dt>
<dd><p>Storage for webview tokens</p>
</dd>
<dt><a href="#ChatLogStorage">ChatLogStorage</a></dt>
<dd><p>Storage for conversation logs</p>
</dd>
<dt><a href="#BotConfigStorage">BotConfigStorage</a></dt>
<dd><p>Storage for wingbot.ai conversation config</p>
</dd>
</dl>

<a name="StateStorage"></a>

## StateStorage
Storage for chat states

**Kind**: global class  

* [StateStorage](#StateStorage)
    * [new StateStorage(mongoDb, collectionName)](#new_StateStorage_new)
    * [._collection](#StateStorage+_collection) : <code>mongodb.Collection</code>
    * [.getOrCreateAndLock(senderId, [defaultState], [timeout])](#StateStorage+getOrCreateAndLock) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.saveState(state)](#StateStorage+saveState) ⇒ <code>Promise.&lt;Object&gt;</code>

<a name="new_StateStorage_new"></a>

### new StateStorage(mongoDb, collectionName)

| Param | Type | Default |
| --- | --- | --- |
| mongoDb | <code>mongodb.Db</code> |  | 
| collectionName | <code>string</code> | <code>&quot;states&quot;</code> | 

<a name="StateStorage+_collection"></a>

### stateStorage._collection : <code>mongodb.Collection</code>
**Kind**: instance property of [<code>StateStorage</code>](#StateStorage)  
<a name="StateStorage+getOrCreateAndLock"></a>

### stateStorage.getOrCreateAndLock(senderId, [defaultState], [timeout]) ⇒ <code>Promise.&lt;Object&gt;</code>
Load state from database and lock it to prevent another reads

**Kind**: instance method of [<code>StateStorage</code>](#StateStorage)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - - conversation state  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| senderId | <code>any</code> |  | sender identifier |
| [defaultState] | <code>Object</code> |  | default state of the conversation |
| [timeout] | <code>number</code> | <code>300</code> | given default state |

<a name="StateStorage+saveState"></a>

### stateStorage.saveState(state) ⇒ <code>Promise.&lt;Object&gt;</code>
Save the state to database

**Kind**: instance method of [<code>StateStorage</code>](#StateStorage)  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>Object</code> | conversation state |

<a name="BotTokenStorage"></a>

## BotTokenStorage
Storage for webview tokens

**Kind**: global class  

* [BotTokenStorage](#BotTokenStorage)
    * [new BotTokenStorage(mongoDb, collectionName)](#new_BotTokenStorage_new)
    * [._collection](#BotTokenStorage+_collection) : <code>mongodb.Collection</code>
    * [.findByToken(token)](#BotTokenStorage+findByToken) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
    * [.getOrCreateToken(senderId, createToken)](#BotTokenStorage+getOrCreateToken) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>

<a name="new_BotTokenStorage_new"></a>

### new BotTokenStorage(mongoDb, collectionName)

| Param | Type | Default |
| --- | --- | --- |
| mongoDb | <code>mongodb.Db</code> |  | 
| collectionName | <code>string</code> | <code>&quot;tokens&quot;</code> | 

<a name="BotTokenStorage+_collection"></a>

### botTokenStorage._collection : <code>mongodb.Collection</code>
**Kind**: instance property of [<code>BotTokenStorage</code>](#BotTokenStorage)  
<a name="BotTokenStorage+findByToken"></a>

### botTokenStorage.findByToken(token) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
**Kind**: instance method of [<code>BotTokenStorage</code>](#BotTokenStorage)  

| Param | Type |
| --- | --- |
| token | <code>string</code> | 

<a name="BotTokenStorage+getOrCreateToken"></a>

### botTokenStorage.getOrCreateToken(senderId, createToken) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
**Kind**: instance method of [<code>BotTokenStorage</code>](#BotTokenStorage)  

| Param | Type |
| --- | --- |
| senderId | <code>string</code> | 
| createToken | <code>Object</code> | 

<a name="ChatLogStorage"></a>

## ChatLogStorage
Storage for conversation logs

**Kind**: global class  

* [ChatLogStorage](#ChatLogStorage)
    * [new ChatLogStorage(mongoDb, collectionName, [log])](#new_ChatLogStorage_new)
    * [._collection](#ChatLogStorage+_collection) : <code>mongodb.Collection</code>
    * [.log(senderId, responses, request)](#ChatLogStorage+log)

<a name="new_ChatLogStorage_new"></a>

### new ChatLogStorage(mongoDb, collectionName, [log])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mongoDb | <code>mongodb.Db</code> |  |  |
| collectionName | <code>string</code> | <code>&quot;chatlogs&quot;</code> |  |
| [log] | <code>Object</code> |  | console like logger |

<a name="ChatLogStorage+_collection"></a>

### chatLogStorage._collection : <code>mongodb.Collection</code>
**Kind**: instance property of [<code>ChatLogStorage</code>](#ChatLogStorage)  
<a name="ChatLogStorage+log"></a>

### chatLogStorage.log(senderId, responses, request)
Log single event

**Kind**: instance method of [<code>ChatLogStorage</code>](#ChatLogStorage)  

| Param | Type | Description |
| --- | --- | --- |
| senderId | <code>string</code> |  |
| responses | <code>Array.&lt;Object&gt;</code> | list of sent responses |
| request | <code>Object</code> | event request |

<a name="BotConfigStorage"></a>

## BotConfigStorage
Storage for wingbot.ai conversation config

**Kind**: global class  

* [BotConfigStorage](#BotConfigStorage)
    * [new BotConfigStorage(mongoDb, collectionName)](#new_BotConfigStorage_new)
    * [._collection](#BotConfigStorage+_collection) : <code>mongodb.Collection</code>
    * [.invalidateConfig()](#BotConfigStorage+invalidateConfig) ⇒ <code>Promise</code>
    * [.getConfigTimestamp()](#BotConfigStorage+getConfigTimestamp) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.updateConfig(newConfig)](#BotConfigStorage+updateConfig) ⇒ <code>Promise.&lt;T&gt;</code>
    * [.getConfig()](#BotConfigStorage+getConfig) ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>

<a name="new_BotConfigStorage_new"></a>

### new BotConfigStorage(mongoDb, collectionName)

| Param | Type | Default |
| --- | --- | --- |
| mongoDb | <code>mongodb.Db</code> |  | 
| collectionName | <code>string</code> | <code>&quot;botconfig&quot;</code> | 

<a name="BotConfigStorage+_collection"></a>

### botConfigStorage._collection : <code>mongodb.Collection</code>
**Kind**: instance property of [<code>BotConfigStorage</code>](#BotConfigStorage)  
<a name="BotConfigStorage+invalidateConfig"></a>

### botConfigStorage.invalidateConfig() ⇒ <code>Promise</code>
Invalidates current configuration

**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
<a name="BotConfigStorage+getConfigTimestamp"></a>

### botConfigStorage.getConfigTimestamp() ⇒ <code>Promise.&lt;number&gt;</code>
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
<a name="BotConfigStorage+updateConfig"></a>

### botConfigStorage.updateConfig(newConfig) ⇒ <code>Promise.&lt;T&gt;</code>
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
**Template**: T  

| Param | Type |
| --- | --- |
| newConfig | <code>T</code> | 

<a name="BotConfigStorage+getConfig"></a>

### botConfigStorage.getConfig() ⇒ <code>Promise.&lt;(Object\|null)&gt;</code>
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
