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
<dt><a href="#AttachmentCache">AttachmentCache</a></dt>
<dd><p>Cache storage for Facebook attachments</p>
</dd>
<dt><a href="#AuditLogStorage">AuditLogStorage</a></dt>
<dd><p>Storage for audit logs with signatures chain</p>
</dd>
<dt><a href="#NotificationsStorage">NotificationsStorage</a></dt>
<dd></dd>
<dt><a href="#BaseStorage">BaseStorage</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#State">State</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#StateCondition">StateCondition</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Token">Token</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Db">Db</a> : <code>module:mongodb/lib/db</code></dt>
<dd></dd>
<dt><a href="#Db">Db</a> : <code>module:mongodb/lib/db</code></dt>
<dd></dd>
<dt><a href="#Collection">Collection</a> : <code>module:mongodb/lib/collection</code></dt>
<dd></dd>
<dt><a href="#Db">Db</a> : <code>module:mongodb/lib/db</code></dt>
<dd></dd>
<dt><a href="#TrackingEvent">TrackingEvent</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#User">User</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Meta">Meta</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#LogEntry">LogEntry</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#JwtVerifier">JwtVerifier</a> ⇒ <code>Promise.&lt;boolean&gt;</code></dt>
<dd><p>JWT Verifier</p>
</dd>
<dt><a href="#AuditLogEntry">AuditLogEntry</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#AuditLogCallback">AuditLogCallback</a> ⇒ <code>Promise</code></dt>
<dd><p>Audit Log Callback</p>
</dd>
<dt><a href="#Target">Target</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Subscribtion">Subscribtion</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Campaign">Campaign</a> : <code>object</code></dt>
<dd></dd>
<dt><a href="#Task">Task</a> : <code>Object</code></dt>
<dd></dd>
<dt><a href="#Db">Db</a> : <code>module:mongodb/lib/db</code></dt>
<dd></dd>
<dt><a href="#Collection">Collection</a> : <code>module:mongodb/lib/collection</code></dt>
<dd></dd>
</dl>

<a name="StateStorage"></a>

## StateStorage
Storage for chat states

**Kind**: global class  

* [StateStorage](#StateStorage)
    * [new StateStorage(mongoDb, collectionName, [log], isCosmo)](#new_StateStorage_new)
    * ~~[.addCustomIndex(index, options)](#StateStorage+addCustomIndex)~~
    * [.getState(senderId, pageId)](#StateStorage+getState) ⇒ <code>Promise.&lt;(State\|null)&gt;</code>
    * [.getOrCreateAndLock(senderId, pageId, [defaultState], [timeout])](#StateStorage+getOrCreateAndLock) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.getStates(condition, limit, lastKey)](#StateStorage+getStates) ⇒ <code>Promise.&lt;{Array.&lt;data:State&gt;, lastKey:string}&gt;</code>
    * [.saveState(state)](#StateStorage+saveState) ⇒ <code>Promise.&lt;object&gt;</code>

<a name="new_StateStorage_new"></a>

### new StateStorage(mongoDb, collectionName, [log], isCosmo)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mongoDb | <code>mongodb.Db</code> \| <code>Object</code> |  |  |
| collectionName | <code>string</code> | <code>&quot;states&quot;</code> |  |
| [log] | <code>Object</code> |  | console like logger |
| isCosmo | <code>boolean</code> | <code>false</code> |  |

<a name="StateStorage+addCustomIndex"></a>

### ~~stateStorage.addCustomIndex(index, options)~~
***Deprecated***

Add custom indexing rule

**Kind**: instance method of [<code>StateStorage</code>](#StateStorage)  

| Param | Type |
| --- | --- |
| index | <code>object</code> | 
| options | <code>object</code> | 
| options.name | <code>string</code> | 

<a name="StateStorage+getState"></a>

### stateStorage.getState(senderId, pageId) ⇒ <code>Promise.&lt;(State\|null)&gt;</code>
**Kind**: instance method of [<code>StateStorage</code>](#StateStorage)  

| Param | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 

<a name="StateStorage+getOrCreateAndLock"></a>

### stateStorage.getOrCreateAndLock(senderId, pageId, [defaultState], [timeout]) ⇒ <code>Promise.&lt;object&gt;</code>
Load state from database and lock it to prevent another reads

**Kind**: instance method of [<code>StateStorage</code>](#StateStorage)  
**Returns**: <code>Promise.&lt;object&gt;</code> - - conversation state  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| senderId | <code>string</code> |  | sender identifier |
| pageId | <code>string</code> |  | page identifier |
| [defaultState] | <code>object</code> |  | default state of the conversation |
| [timeout] | <code>number</code> | <code>300</code> | given default state |

<a name="StateStorage+getStates"></a>

### stateStorage.getStates(condition, limit, lastKey) ⇒ <code>Promise.&lt;{Array.&lt;data:State&gt;, lastKey:string}&gt;</code>
**Kind**: instance method of [<code>StateStorage</code>](#StateStorage)  

| Param | Type | Default |
| --- | --- | --- |
| condition | [<code>StateCondition</code>](#StateCondition) |  | 
| limit | <code>number</code> | <code>20</code> | 
| lastKey | <code>string</code> | <code>null</code> | 

<a name="StateStorage+saveState"></a>

### stateStorage.saveState(state) ⇒ <code>Promise.&lt;object&gt;</code>
Save the state to database

**Kind**: instance method of [<code>StateStorage</code>](#StateStorage)  

| Param | Type | Description |
| --- | --- | --- |
| state | <code>object</code> | conversation state |

<a name="BotTokenStorage"></a>

## BotTokenStorage
Storage for webview tokens

**Kind**: global class  

* [BotTokenStorage](#BotTokenStorage)
    * [new BotTokenStorage(mongoDb, collectionName)](#new_BotTokenStorage_new)
    * [._collection](#BotTokenStorage+_collection) : <code>mongodb.Collection</code>
    * [._getCollection()](#BotTokenStorage+_getCollection) ⇒ <code>Promise.&lt;mongodb.Collection&gt;</code>
    * [.findByToken(token)](#BotTokenStorage+findByToken) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
    * [.getOrCreateToken(senderId, pageId, createToken)](#BotTokenStorage+getOrCreateToken) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>

<a name="new_BotTokenStorage_new"></a>

### new BotTokenStorage(mongoDb, collectionName)

| Param | Type | Default |
| --- | --- | --- |
| mongoDb | <code>mongodb.Db</code> \| <code>Object</code> |  | 
| collectionName | <code>string</code> | <code>&quot;tokens&quot;</code> | 

<a name="BotTokenStorage+_collection"></a>

### botTokenStorage.\_collection : <code>mongodb.Collection</code>
**Kind**: instance property of [<code>BotTokenStorage</code>](#BotTokenStorage)  
<a name="BotTokenStorage+_getCollection"></a>

### botTokenStorage.\_getCollection() ⇒ <code>Promise.&lt;mongodb.Collection&gt;</code>
**Kind**: instance method of [<code>BotTokenStorage</code>](#BotTokenStorage)  
<a name="BotTokenStorage+findByToken"></a>

### botTokenStorage.findByToken(token) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
**Kind**: instance method of [<code>BotTokenStorage</code>](#BotTokenStorage)  

| Param | Type |
| --- | --- |
| token | <code>string</code> | 

<a name="BotTokenStorage+getOrCreateToken"></a>

### botTokenStorage.getOrCreateToken(senderId, pageId, createToken) ⇒ <code>Promise.&lt;(Token\|null)&gt;</code>
**Kind**: instance method of [<code>BotTokenStorage</code>](#BotTokenStorage)  

| Param | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| createToken | <code>Object</code> | 

<a name="ChatLogStorage"></a>

## ChatLogStorage
Storage for conversation logs

**Kind**: global class  

* [ChatLogStorage](#ChatLogStorage)
    * [new ChatLogStorage(mongoDb, collectionName, [log], [isCosmo], [secret])](#new_ChatLogStorage_new)
    * [.getInteractions(senderId, pageId, [limit], [endAt], [startAt])](#ChatLogStorage+getInteractions) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
    * [.log(senderId, responses, request, [metadata])](#ChatLogStorage+log) ⇒ <code>Promise</code>

<a name="new_ChatLogStorage_new"></a>

### new ChatLogStorage(mongoDb, collectionName, [log], [isCosmo], [secret])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mongoDb | [<code>Db</code>](#Db) \| <code>Object</code> |  |  |
| collectionName | <code>string</code> | <code>&quot;chatlogs&quot;</code> |  |
| [log] | <code>Object</code> |  | console like logger |
| [isCosmo] | <code>boolean</code> | <code>false</code> |  |
| [secret] | <code>string</code> \| <code>Promise.&lt;string&gt;</code> | <code>null</code> |  |

<a name="ChatLogStorage+getInteractions"></a>

### chatLogStorage.getInteractions(senderId, pageId, [limit], [endAt], [startAt]) ⇒ <code>Promise.&lt;Array.&lt;object&gt;&gt;</code>
Interate history
all limits are inclusive

**Kind**: instance method of [<code>ChatLogStorage</code>](#ChatLogStorage)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| senderId | <code>string</code> |  |  |
| pageId | <code>string</code> |  |  |
| [limit] | <code>number</code> | <code>10</code> |  |
| [endAt] | <code>number</code> | <code></code> | iterate backwards to history |
| [startAt] | <code>number</code> | <code></code> | iterate forward to last interaction |

<a name="ChatLogStorage+log"></a>

### chatLogStorage.log(senderId, responses, request, [metadata]) ⇒ <code>Promise</code>
Log single event

**Kind**: instance method of [<code>ChatLogStorage</code>](#ChatLogStorage)  

| Param | Type | Description |
| --- | --- | --- |
| senderId | <code>string</code> |  |
| responses | <code>Array.&lt;object&gt;</code> | list of sent responses |
| request | <code>object</code> | event request |
| [metadata] | <code>object</code> | request metadata |

<a name="BotConfigStorage"></a>

## BotConfigStorage
Storage for wingbot.ai conversation config

**Kind**: global class  

* [BotConfigStorage](#BotConfigStorage)
    * [new BotConfigStorage(mongoDb, collectionName)](#new_BotConfigStorage_new)
    * [._collection](#BotConfigStorage+_collection) : [<code>Collection</code>](#Collection)
    * [._getCollection()](#BotConfigStorage+_getCollection) ⇒ [<code>Promise.&lt;Collection&gt;</code>](#Collection)
    * [.api([onUpdate], [acl])](#BotConfigStorage+api) ⇒ <code>Object</code>
    * [.invalidateConfig()](#BotConfigStorage+invalidateConfig) ⇒ <code>Promise</code>
    * [.getConfigTimestamp()](#BotConfigStorage+getConfigTimestamp) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.updateConfig(newConfig, [id])](#BotConfigStorage+updateConfig) ⇒ <code>Promise.&lt;T&gt;</code>
    * [.setConfig(id, newConfig)](#BotConfigStorage+setConfig)
    * [.getConfig([id])](#BotConfigStorage+getConfig) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>

<a name="new_BotConfigStorage_new"></a>

### new BotConfigStorage(mongoDb, collectionName)

| Param | Type | Default |
| --- | --- | --- |
| mongoDb | [<code>Db</code>](#Db) \| <code>Object</code> |  | 
| collectionName | <code>string</code> | <code>&quot;botconfig&quot;</code> | 

<a name="BotConfigStorage+_collection"></a>

### botConfigStorage.\_collection : [<code>Collection</code>](#Collection)
**Kind**: instance property of [<code>BotConfigStorage</code>](#BotConfigStorage)  
<a name="BotConfigStorage+_getCollection"></a>

### botConfigStorage.\_getCollection() ⇒ [<code>Promise.&lt;Collection&gt;</code>](#Collection)
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
<a name="BotConfigStorage+api"></a>

### botConfigStorage.api([onUpdate], [acl]) ⇒ <code>Object</code>
Returns botUpdate API for wingbot

**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  

| Param | Type | Description |
| --- | --- | --- |
| [onUpdate] | <code>function</code> | async update handler function |
| [acl] | <code>function</code> \| <code>Array.&lt;string&gt;</code> | acl configuration |

<a name="BotConfigStorage+invalidateConfig"></a>

### botConfigStorage.invalidateConfig() ⇒ <code>Promise</code>
Invalidates current configuration

**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
<a name="BotConfigStorage+getConfigTimestamp"></a>

### botConfigStorage.getConfigTimestamp() ⇒ <code>Promise.&lt;number&gt;</code>
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  
<a name="BotConfigStorage+updateConfig"></a>

### botConfigStorage.updateConfig(newConfig, [id]) ⇒ <code>Promise.&lt;T&gt;</code>
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  

| Param | Type |
| --- | --- |
| newConfig | <code>T</code> | 
| [id] | <code>string</code> | 

<a name="BotConfigStorage+setConfig"></a>

### botConfigStorage.setConfig(id, newConfig)
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  

| Param | Type |
| --- | --- |
| id | <code>string</code> | 
| newConfig | <code>object</code> | 

<a name="BotConfigStorage+getConfig"></a>

### botConfigStorage.getConfig([id]) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
**Kind**: instance method of [<code>BotConfigStorage</code>](#BotConfigStorage)  

| Param | Type |
| --- | --- |
| [id] | <code>string</code> | 

<a name="AttachmentCache"></a>

## AttachmentCache
Cache storage for Facebook attachments

**Kind**: global class  

* [AttachmentCache](#AttachmentCache)
    * [new AttachmentCache(mongoDb, collectionName)](#new_AttachmentCache_new)
    * [._collection](#AttachmentCache+_collection) : <code>mongodb.Collection</code>
    * [._getCollection()](#AttachmentCache+_getCollection) ⇒ <code>Promise.&lt;mongodb.Collection&gt;</code>
    * [.findAttachmentByUrl(url)](#AttachmentCache+findAttachmentByUrl) ⇒ <code>Promise.&lt;(number\|null)&gt;</code>
    * [.saveAttachmentId(url, attachmentId)](#AttachmentCache+saveAttachmentId) ⇒ <code>Promise</code>

<a name="new_AttachmentCache_new"></a>

### new AttachmentCache(mongoDb, collectionName)

| Param | Type | Default |
| --- | --- | --- |
| mongoDb | <code>mongodb.Db</code> \| <code>Object</code> |  | 
| collectionName | <code>string</code> | <code>&quot;attachments&quot;</code> | 

<a name="AttachmentCache+_collection"></a>

### attachmentCache.\_collection : <code>mongodb.Collection</code>
**Kind**: instance property of [<code>AttachmentCache</code>](#AttachmentCache)  
<a name="AttachmentCache+_getCollection"></a>

### attachmentCache.\_getCollection() ⇒ <code>Promise.&lt;mongodb.Collection&gt;</code>
**Kind**: instance method of [<code>AttachmentCache</code>](#AttachmentCache)  
<a name="AttachmentCache+findAttachmentByUrl"></a>

### attachmentCache.findAttachmentByUrl(url) ⇒ <code>Promise.&lt;(number\|null)&gt;</code>
**Kind**: instance method of [<code>AttachmentCache</code>](#AttachmentCache)  

| Param | Type |
| --- | --- |
| url | <code>string</code> | 

<a name="AttachmentCache+saveAttachmentId"></a>

### attachmentCache.saveAttachmentId(url, attachmentId) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>AttachmentCache</code>](#AttachmentCache)  

| Param | Type |
| --- | --- |
| url | <code>string</code> | 
| attachmentId | <code>number</code> | 

<a name="AuditLogStorage"></a>

## AuditLogStorage
Storage for audit logs with signatures chain

**Kind**: global class  

* [AuditLogStorage](#AuditLogStorage)
    * [new AuditLogStorage(mongoDb, collectionName, [log], [isCosmo], [secret], [jwtVerifier])](#new_AuditLogStorage_new)
    * [._jwtVerify](#AuditLogStorage+_jwtVerify) : [<code>JwtVerifier</code>](#JwtVerifier)
    * [.callback](#AuditLogStorage+callback) : [<code>AuditLogCallback</code>](#AuditLogCallback)
    * [.log(event, user, [meta], [wid], [type], [level], [date])](#AuditLogStorage+log) ⇒ <code>Promise</code>
    * [.list([wid], [fromSeq], [limit])](#AuditLogStorage+list) ⇒ <code>Promise.&lt;Array.&lt;LogEntry&gt;&gt;</code>

<a name="new_AuditLogStorage_new"></a>

### new AuditLogStorage(mongoDb, collectionName, [log], [isCosmo], [secret], [jwtVerifier])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mongoDb | [<code>Db</code>](#Db) \| <code>Object</code> |  |  |
| collectionName | <code>string</code> | <code>&quot;auditlog&quot;</code> |  |
| [log] | <code>Object</code> |  | console like logger |
| [isCosmo] | <code>boolean</code> | <code>false</code> |  |
| [secret] | <code>string</code> \| <code>Promise.&lt;string&gt;</code> | <code>null</code> |  |
| [jwtVerifier] | <code>string</code> \| <code>Promise.&lt;string&gt;</code> | <code>null</code> |  |

<a name="AuditLogStorage+_jwtVerify"></a>

### auditLogStorage.\_jwtVerify : [<code>JwtVerifier</code>](#JwtVerifier)
**Kind**: instance property of [<code>AuditLogStorage</code>](#AuditLogStorage)  
<a name="AuditLogStorage+callback"></a>

### auditLogStorage.callback : [<code>AuditLogCallback</code>](#AuditLogCallback)
**Kind**: instance property of [<code>AuditLogStorage</code>](#AuditLogStorage)  
<a name="AuditLogStorage+log"></a>

### auditLogStorage.log(event, user, [meta], [wid], [type], [level], [date]) ⇒ <code>Promise</code>
Add a log

**Kind**: instance method of [<code>AuditLogStorage</code>](#AuditLogStorage)  

| Param | Type | Description |
| --- | --- | --- |
| event | [<code>TrackingEvent</code>](#TrackingEvent) |  |
| user | [<code>User</code>](#User) |  |
| [meta] | [<code>Meta</code>](#Meta) |  |
| [wid] | <code>string</code> | workspace ID |
| [type] | <code>string</code> |  |
| [level] | <code>string</code> |  |
| [date] | <code>Date</code> |  |

<a name="AuditLogStorage+list"></a>

### auditLogStorage.list([wid], [fromSeq], [limit]) ⇒ <code>Promise.&lt;Array.&lt;LogEntry&gt;&gt;</code>
**Kind**: instance method of [<code>AuditLogStorage</code>](#AuditLogStorage)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [wid] | <code>string</code> |  | workspace id |
| [fromSeq] | <code>number</code> | <code>0</code> | for paging |
| [limit] | <code>number</code> | <code>40</code> |  |

<a name="NotificationsStorage"></a>

## NotificationsStorage
**Kind**: global class  

* [NotificationsStorage](#NotificationsStorage)
    * [new NotificationsStorage(mongoDb, collectionsPrefix, [log], isCosmo)](#new_NotificationsStorage_new)
    * [._collections](#NotificationsStorage+_collections) : <code>Map.&lt;string, Promise.&lt;mongodb.Collection&gt;&gt;</code>
    * [._getCollection(collectionName)](#NotificationsStorage+_getCollection) ⇒ <code>Promise.&lt;mongodb.Collection&gt;</code>
    * [.pushTasks(tasks)](#NotificationsStorage+pushTasks) ⇒ <code>Promise.&lt;Array.&lt;Task&gt;&gt;</code>
    * [.getUnsuccessfulSubscribersByCampaign(campaignId, [sentWithoutReaction], [pageId])](#NotificationsStorage+getUnsuccessfulSubscribersByCampaign)
    * [.getTaskById(taskId)](#NotificationsStorage+getTaskById) ⇒ <code>Promise.&lt;(Task\|null)&gt;</code>
    * [.updateTask(taskId, data)](#NotificationsStorage+updateTask)
    * [.getSentTask(pageId, senderId, campaignId)](#NotificationsStorage+getSentTask) ⇒ <code>Promise.&lt;(Task\|null)&gt;</code>
    * [.getSentCampagnIds(pageId, senderId, checkCampaignIds)](#NotificationsStorage+getSentCampagnIds) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
    * [.updateTasksByWatermark(senderId, pageId, watermark, eventType, ts)](#NotificationsStorage+updateTasksByWatermark) ⇒ <code>Promise.&lt;Array.&lt;Task&gt;&gt;</code>
    * [.upsertCampaign(campaign, [updateCampaign])](#NotificationsStorage+upsertCampaign) ⇒ [<code>Promise.&lt;Campaign&gt;</code>](#Campaign)
    * [.removeCampaign(campaignId)](#NotificationsStorage+removeCampaign) ⇒ <code>Promise</code>
    * [.incrementCampaign(campaignId, increment)](#NotificationsStorage+incrementCampaign) ⇒ <code>Promise</code>
    * [.updateCampaign(campaignId, data)](#NotificationsStorage+updateCampaign) ⇒ <code>Promise.&lt;(Campaign\|null)&gt;</code>
    * [.popCampaign([now])](#NotificationsStorage+popCampaign) ⇒ <code>Promise.&lt;(Campaign\|null)&gt;</code>
    * [.getCampaignById(campaignId)](#NotificationsStorage+getCampaignById) ⇒ <code>Promise.&lt;(null\|Campaign)&gt;</code>
    * [.getCampaignByIds(campaignIds)](#NotificationsStorage+getCampaignByIds) ⇒ <code>Promise.&lt;Array.&lt;Campaign&gt;&gt;</code>
    * [.getCampaigns(condition, [limit], [lastKey])](#NotificationsStorage+getCampaigns) ⇒ <code>Promise.&lt;{Array.&lt;data:Campaign&gt;, lastKey:string}&gt;</code>
    * [.subscribe(senderId, pageId, tag)](#NotificationsStorage+subscribe) ⇒ <code>Promise</code>
    * [.unsubscribe(senderId, pageId, [tag])](#NotificationsStorage+unsubscribe) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
    * [.getSubscribtionsCount(include, exclude, [pageId])](#NotificationsStorage+getSubscribtionsCount) ⇒ <code>Promise.&lt;number&gt;</code>
    * [.getSubscribtions(include, exclude, limit, [pageId], lastKey)](#NotificationsStorage+getSubscribtions) ⇒ <code>Promise.&lt;{data: Array.&lt;Target&gt;, lastKey: string}&gt;</code>
    * [.getSenderSubscribtions(senderId, pageId)](#NotificationsStorage+getSenderSubscribtions) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>

<a name="new_NotificationsStorage_new"></a>

### new NotificationsStorage(mongoDb, collectionsPrefix, [log], isCosmo)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mongoDb | <code>mongodb.Db</code> \| <code>Object</code> |  |  |
| collectionsPrefix | <code>string</code> |  |  |
| [log] | <code>Object</code> |  | console like logger |
| isCosmo | <code>boolean</code> | <code>false</code> |  |

<a name="NotificationsStorage+_collections"></a>

### notificationsStorage.\_collections : <code>Map.&lt;string, Promise.&lt;mongodb.Collection&gt;&gt;</code>
**Kind**: instance property of [<code>NotificationsStorage</code>](#NotificationsStorage)  
<a name="NotificationsStorage+_getCollection"></a>

### notificationsStorage.\_getCollection(collectionName) ⇒ <code>Promise.&lt;mongodb.Collection&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| collectionName | <code>string</code> | 

<a name="NotificationsStorage+pushTasks"></a>

### notificationsStorage.pushTasks(tasks) ⇒ <code>Promise.&lt;Array.&lt;Task&gt;&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| tasks | <code>object</code> | 

<a name="NotificationsStorage+getUnsuccessfulSubscribersByCampaign"></a>

### notificationsStorage.getUnsuccessfulSubscribersByCampaign(campaignId, [sentWithoutReaction], [pageId])
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type | Default |
| --- | --- | --- |
| campaignId | <code>string</code> |  | 
| [sentWithoutReaction] | <code>boolean</code> | <code>false</code> | 
| [pageId] | <code>string</code> | <code>null</code> | 

<a name="NotificationsStorage+getTaskById"></a>

### notificationsStorage.getTaskById(taskId) ⇒ <code>Promise.&lt;(Task\|null)&gt;</code>
Return Task By Id

**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| taskId | <code>string</code> | 

<a name="NotificationsStorage+updateTask"></a>

### notificationsStorage.updateTask(taskId, data)
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| taskId | <code>string</code> | 
| data | <code>object</code> | 

<a name="NotificationsStorage+getSentTask"></a>

### notificationsStorage.getSentTask(pageId, senderId, campaignId) ⇒ <code>Promise.&lt;(Task\|null)&gt;</code>
Get last sent task from campaign

**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| pageId | <code>string</code> | 
| senderId | <code>string</code> | 
| campaignId | <code>string</code> | 

<a name="NotificationsStorage+getSentCampagnIds"></a>

### notificationsStorage.getSentCampagnIds(pageId, senderId, checkCampaignIds) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| pageId | <code>string</code> | 
| senderId | <code>string</code> | 
| checkCampaignIds | <code>Array.&lt;string&gt;</code> | 

<a name="NotificationsStorage+updateTasksByWatermark"></a>

### notificationsStorage.updateTasksByWatermark(senderId, pageId, watermark, eventType, ts) ⇒ <code>Promise.&lt;Array.&lt;Task&gt;&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| watermark | <code>number</code> | 
| eventType | <code>&#x27;read&#x27;</code> \| <code>&#x27;delivery&#x27;</code> | 
| ts | <code>number</code> | 

<a name="NotificationsStorage+upsertCampaign"></a>

### notificationsStorage.upsertCampaign(campaign, [updateCampaign]) ⇒ [<code>Promise.&lt;Campaign&gt;</code>](#Campaign)
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type | Default |
| --- | --- | --- |
| campaign | <code>object</code> |  | 
| [updateCampaign] | <code>object</code> | <code></code> | 

<a name="NotificationsStorage+removeCampaign"></a>

### notificationsStorage.removeCampaign(campaignId) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| campaignId | <code>string</code> | 

<a name="NotificationsStorage+incrementCampaign"></a>

### notificationsStorage.incrementCampaign(campaignId, increment) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| campaignId | <code>string</code> | 
| increment | <code>object</code> | 

<a name="NotificationsStorage+updateCampaign"></a>

### notificationsStorage.updateCampaign(campaignId, data) ⇒ <code>Promise.&lt;(Campaign\|null)&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| campaignId | <code>string</code> | 
| data | <code>object</code> | 

<a name="NotificationsStorage+popCampaign"></a>

### notificationsStorage.popCampaign([now]) ⇒ <code>Promise.&lt;(Campaign\|null)&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| [now] | <code>number</code> | 

<a name="NotificationsStorage+getCampaignById"></a>

### notificationsStorage.getCampaignById(campaignId) ⇒ <code>Promise.&lt;(null\|Campaign)&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| campaignId | <code>string</code> | 

<a name="NotificationsStorage+getCampaignByIds"></a>

### notificationsStorage.getCampaignByIds(campaignIds) ⇒ <code>Promise.&lt;Array.&lt;Campaign&gt;&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| campaignIds | <code>Array.&lt;string&gt;</code> | 

<a name="NotificationsStorage+getCampaigns"></a>

### notificationsStorage.getCampaigns(condition, [limit], [lastKey]) ⇒ <code>Promise.&lt;{Array.&lt;data:Campaign&gt;, lastKey:string}&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type | Default |
| --- | --- | --- |
| condition | <code>object</code> |  | 
| [limit] | <code>number</code> | <code></code> | 
| [lastKey] | <code>object</code> | <code></code> | 

<a name="NotificationsStorage+subscribe"></a>

### notificationsStorage.subscribe(senderId, pageId, tag) ⇒ <code>Promise</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| tag | <code>string</code> | 

<a name="NotificationsStorage+unsubscribe"></a>

### notificationsStorage.unsubscribe(senderId, pageId, [tag]) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type | Default |
| --- | --- | --- |
| senderId | <code>string</code> |  | 
| pageId | <code>string</code> |  | 
| [tag] | <code>string</code> | <code>null</code> | 

<a name="NotificationsStorage+getSubscribtionsCount"></a>

### notificationsStorage.getSubscribtionsCount(include, exclude, [pageId]) ⇒ <code>Promise.&lt;number&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type | Default |
| --- | --- | --- |
| include | <code>Array.&lt;string&gt;</code> |  | 
| exclude | <code>Array.&lt;string&gt;</code> |  | 
| [pageId] | <code>string</code> | <code>null</code> | 

<a name="NotificationsStorage+getSubscribtions"></a>

### notificationsStorage.getSubscribtions(include, exclude, limit, [pageId], lastKey) ⇒ <code>Promise.&lt;{data: Array.&lt;Target&gt;, lastKey: string}&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type | Default |
| --- | --- | --- |
| include | <code>Array.&lt;string&gt;</code> |  | 
| exclude | <code>Array.&lt;string&gt;</code> |  | 
| limit | <code>number</code> |  | 
| [pageId] | <code>string</code> | <code>null</code> | 
| lastKey | <code>\*</code> | <code></code> | 

<a name="NotificationsStorage+getSenderSubscribtions"></a>

### notificationsStorage.getSenderSubscribtions(senderId, pageId) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
**Kind**: instance method of [<code>NotificationsStorage</code>](#NotificationsStorage)  

| Param | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 

<a name="BaseStorage"></a>

## BaseStorage
**Kind**: global class  

* [BaseStorage](#BaseStorage)
    * [new BaseStorage(mongoDb, collectionName, [log], [isCosmo])](#new_BaseStorage_new)
    * [._collection](#BaseStorage+_collection) : [<code>Collection</code>](#Collection) \| [<code>Promise.&lt;Collection&gt;</code>](#Collection)
    * [.addFixtureDoc(...objects)](#BaseStorage+addFixtureDoc)
    * [.addIndex(index, options)](#BaseStorage+addIndex)
    * [._getCollection()](#BaseStorage+_getCollection) ⇒ [<code>Promise.&lt;Collection&gt;</code>](#Collection)

<a name="new_BaseStorage_new"></a>

### new BaseStorage(mongoDb, collectionName, [log], [isCosmo])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mongoDb | [<code>Db</code>](#Db) \| <code>Object</code> |  |  |
| collectionName | <code>string</code> |  |  |
| [log] | <code>Object</code> |  | console like logger |
| [isCosmo] | <code>boolean</code> | <code>false</code> |  |

**Example**  
```javascript
const { BaseStorage } = require('winbot-mongodb');

class MyCoolDataStorage extends BaseStorage {

    constructor (mongoDb, collectionName = 'myCoolData', log = console, isCosmo = false) {
         super(mongoDb, collectionName, log, isCosmo);

         this.addIndex({
             foo: -1
         }, {
             name: 'foo_1'
         });

         this.addIndex({
             bar: -1,
             baz: 1
         }, {
             name: 'bar_-1_baz_1'
         });
    }

}
```
<a name="BaseStorage+_collection"></a>

### baseStorage.\_collection : [<code>Collection</code>](#Collection) \| [<code>Promise.&lt;Collection&gt;</code>](#Collection)
**Kind**: instance property of [<code>BaseStorage</code>](#BaseStorage)  
<a name="BaseStorage+addFixtureDoc"></a>

### baseStorage.addFixtureDoc(...objects)
Insert defalt document to DB

**Kind**: instance method of [<code>BaseStorage</code>](#BaseStorage)  

| Param | Type |
| --- | --- |
| ...objects | <code>any</code> | 

<a name="BaseStorage+addIndex"></a>

### baseStorage.addIndex(index, options)
Add custom indexing rule

**Kind**: instance method of [<code>BaseStorage</code>](#BaseStorage)  

| Param | Type |
| --- | --- |
| index | <code>object</code> | 
| options | <code>mongodb.IndexOptions</code> | 

<a name="BaseStorage+_getCollection"></a>

### baseStorage.\_getCollection() ⇒ [<code>Promise.&lt;Collection&gt;</code>](#Collection)
Returns the collection to operate with

**Kind**: instance method of [<code>BaseStorage</code>](#BaseStorage)  
<a name="State"></a>

## State : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| state | <code>object</code> | 

<a name="StateCondition"></a>

## StateCondition : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| [search] | <code>string</code> | 

<a name="Token"></a>

## Token : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| token | <code>string</code> | 

<a name="Db"></a>

## Db : <code>module:mongodb/lib/db</code>
**Kind**: global typedef  
<a name="Db"></a>

## Db : <code>module:mongodb/lib/db</code>
**Kind**: global typedef  
<a name="Collection"></a>

## Collection : <code>module:mongodb/lib/collection</code>
**Kind**: global typedef  
<a name="Db"></a>

## Db : <code>module:mongodb/lib/db</code>
**Kind**: global typedef  
<a name="TrackingEvent"></a>

## TrackingEvent : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Default |
| --- | --- | --- |
| [type] | <code>string</code> | <code>&quot;&#x27;audit&#x27;&quot;</code> | 
| category | <code>string</code> |  | 
| action | <code>string</code> |  | 
| [label] | <code>string</code> |  | 
| [payload] | <code>object</code> |  | 

<a name="User"></a>

## User : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [id] | <code>string</code> |  |
| [senderId] | <code>string</code> |  |
| [pageId] | <code>string</code> |  |
| [jwt] | <code>string</code> | jwt to check the authorship |

<a name="Meta"></a>

## Meta : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [ip] | <code>string</code> |  |
| [ua] | <code>string</code> |  |
| [ro] | <code>string</code> | referrer || origin |

<a name="LogEntry"></a>

## LogEntry : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| date | <code>string</code> |  | ISO date |
| delta | <code>number</code> |  | time skew in ms if there was a write conflict |
| [eventType] | <code>string</code> | <code>&quot;&#x27;audit&#x27;&quot;</code> |  |
| category | <code>string</code> |  |  |
| action | <code>string</code> |  |  |
| [label] | <code>string</code> |  |  |
| [payload] | <code>object</code> |  |  |
| level | <code>string</code> |  | (Critical|Important|Debug) |
| ok | <code>boolean</code> |  | signature matches |
| seq | <code>number</code> |  | sequence number |
| type | <code>string</code> |  | (Error|Warn|Info) |
| user | [<code>User</code>](#User) |  |  |
| wid | <code>string</code> |  | workspace id |
| meta | [<code>Meta</code>](#Meta) |  |  |

<a name="JwtVerifier"></a>

## JwtVerifier ⇒ <code>Promise.&lt;boolean&gt;</code>
JWT Verifier

**Kind**: global typedef  

| Param | Type |
| --- | --- |
| token | <code>string</code> | 
| userId | <code>string</code> | 
| [user] | [<code>User</code>](#User) | 

<a name="AuditLogEntry"></a>

## AuditLogEntry : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| date | <code>string</code> |  | ISO date |
| [eventType] | <code>string</code> | <code>&quot;&#x27;audit&#x27;&quot;</code> |  |
| category | <code>string</code> |  |  |
| action | <code>string</code> |  |  |
| [label] | <code>string</code> |  |  |
| [payload] | <code>object</code> |  |  |
| level | <code>string</code> |  | (Critical|Important|Debug) |
| type | <code>string</code> |  | (Error|Warn|Info) |
| user | [<code>User</code>](#User) |  |  |
| wid | <code>string</code> |  | workspace id |
| meta | [<code>Meta</code>](#Meta) |  |  |

<a name="AuditLogCallback"></a>

## AuditLogCallback ⇒ <code>Promise</code>
Audit Log Callback

**Kind**: global typedef  

| Param | Type |
| --- | --- |
| entry | [<code>AuditLogEntry</code>](#AuditLogEntry) | 

<a name="Target"></a>

## Target : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 

<a name="Subscribtion"></a>

## Subscribtion : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type |
| --- | --- |
| senderId | <code>string</code> | 
| pageId | <code>string</code> | 
| subs | <code>Array.&lt;string&gt;</code> | 

<a name="Campaign"></a>

## Campaign : <code>object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> |  |
| name | <code>string</code> | Tatgeting |
| include | <code>Array.&lt;string&gt;</code> |  |
| exclude | <code>Array.&lt;string&gt;</code> | Stats |
| sent | <code>number</code> |  |
| succeeded | <code>number</code> |  |
| failed | <code>number</code> |  |
| unsubscribed | <code>number</code> |  |
| delivery | <code>number</code> |  |
| read | <code>number</code> |  |
| notSent | <code>number</code> |  |
| leaved | <code>number</code> |  |
| queued | <code>number</code> | Interaction |
| action | <code>string</code> |  |
| [data] | <code>object</code> | Setup |
| sliding | <code>boolean</code> |  |
| slide | <code>number</code> |  |
| slideRound | <code>number</code> |  |
| active | <code>boolean</code> |  |
| in24hourWindow | <code>boolean</code> |  |
| startAt | <code>number</code> |  |

<a name="Task"></a>

## Task : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> |  |
| pageId | <code>string</code> |  |
| senderId | <code>string</code> |  |
| campaignId | <code>string</code> |  |
| enqueue | <code>number</code> |  |
| [read] | <code>number</code> |  |
| [delivery] | <code>number</code> |  |
| [sent] | <code>number</code> |  |
| [insEnqueue] | <code>number</code> |  |
| [reaction] | <code>boolean</code> | user reacted |
| [leaved] | <code>number</code> | time the event was not sent because user left |

<a name="Db"></a>

## Db : <code>module:mongodb/lib/db</code>
**Kind**: global typedef  
<a name="Collection"></a>

## Collection : <code>module:mongodb/lib/collection</code>
**Kind**: global typedef  
