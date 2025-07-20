# Service Provider Specifications

## Overview

This document defines the specifications for each service provider type in the MosAIc orchestration platform. It covers Git providers, CI/CD systems, knowledge bases, workflow engines, and AI/LLM providers.

## Table of Contents

1. [Git Providers](#git-providers)
2. [CI/CD Providers](#cicd-providers)
3. [Knowledge Base Providers](#knowledge-base-providers)
4. [Workflow Engine Providers](#workflow-engine-providers)
5. [AI/LLM Providers](#aillm-providers)
6. [Provider Comparison Matrix](#provider-comparison-matrix)

## Git Providers

### Common Git Interface

```typescript
interface IGitProvider {
  // Repository Management
  createRepository(params: CreateRepoParams): Promise<Repository>;
  getRepository(params: GetRepoParams): Promise<Repository>;
  updateRepository(params: UpdateRepoParams): Promise<Repository>;
  deleteRepository(params: DeleteRepoParams): Promise<void>;
  listRepositories(params: ListReposParams): Promise<Repository[]>;
  forkRepository(params: ForkRepoParams): Promise<Repository>;
  
  // Branch Management
  createBranch(params: CreateBranchParams): Promise<Branch>;
  getBranch(params: GetBranchParams): Promise<Branch>;
  deleteBranch(params: DeleteBranchParams): Promise<void>;
  listBranches(params: ListBranchesParams): Promise<Branch[]>;
  protectBranch(params: ProtectBranchParams): Promise<BranchProtection>;
  
  // Pull/Merge Request Management
  createPullRequest(params: CreatePRParams): Promise<PullRequest>;
  getPullRequest(params: GetPRParams): Promise<PullRequest>;
  updatePullRequest(params: UpdatePRParams): Promise<PullRequest>;
  mergePullRequest(params: MergePRParams): Promise<MergeResult>;
  listPullRequests(params: ListPRParams): Promise<PullRequest[]>;
  
  // Commit Management
  getCommit(params: GetCommitParams): Promise<Commit>;
  listCommits(params: ListCommitsParams): Promise<Commit[]>;
  createCommit(params: CreateCommitParams): Promise<Commit>;
  compareCommits(params: CompareParams): Promise<Comparison>;
  
  // Tag Management
  createTag(params: CreateTagParams): Promise<Tag>;
  getTag(params: GetTagParams): Promise<Tag>;
  deleteTag(params: DeleteTagParams): Promise<void>;
  listTags(params: ListTagsParams): Promise<Tag[]>;
  
  // Webhook Management
  createWebhook(params: CreateWebhookParams): Promise<Webhook>;
  updateWebhook(params: UpdateWebhookParams): Promise<Webhook>;
  deleteWebhook(params: DeleteWebhookParams): Promise<void>;
  listWebhooks(params: ListWebhooksParams): Promise<Webhook[]>;
  
  // Collaboration
  addCollaborator(params: AddCollaboratorParams): Promise<void>;
  removeCollaborator(params: RemoveCollaboratorParams): Promise<void>;
  listCollaborators(params: ListCollaboratorsParams): Promise<Collaborator[]>;
  
  // Issues (if supported)
  createIssue?(params: CreateIssueParams): Promise<Issue>;
  updateIssue?(params: UpdateIssueParams): Promise<Issue>;
  closeIssue?(params: CloseIssueParams): Promise<void>;
  listIssues?(params: ListIssuesParams): Promise<Issue[]>;
}
```

### GitHub Provider

```typescript
class GitHubProvider implements IGitProvider {
  private octokit: Octokit;
  
  capabilities = {
    issues: true,
    projects: true,
    actions: true,
    packages: true,
    pages: true,
    discussions: true,
    sponsorship: true,
    marketplace: true
  };
  
  authentication = {
    methods: ['token', 'oauth', 'app'],
    scopes: {
      'repo': 'Full repository access',
      'write:org': 'Organization write access',
      'admin:repo_hook': 'Webhook management',
      'workflow': 'GitHub Actions access'
    }
  };
  
  rateLimits = {
    authenticated: {
      requests: 5000,
      window: 3600000, // 1 hour
      searchRequests: 30,
      searchWindow: 60000 // 1 minute
    },
    unauthenticated: {
      requests: 60,
      window: 3600000
    }
  };
  
  specialFeatures = {
    // GitHub-specific features
    async enablePages(repo: string): Promise<void> {
      await this.octokit.repos.createPagesSite({
        owner: repo.split('/')[0],
        repo: repo.split('/')[1],
        source: { branch: 'main', path: '/' }
      });
    },
    
    async createGitHubAction(
      repo: string, 
      workflow: WorkflowDefinition
    ): Promise<void> {
      // Create workflow file
      await this.createFile({
        repository: repo,
        path: `.github/workflows/${workflow.name}.yml`,
        content: workflow.content,
        message: `Add ${workflow.name} workflow`
      });
    },
    
    async createRelease(params: CreateReleaseParams): Promise<Release> {
      const { data } = await this.octokit.repos.createRelease({
        owner: params.owner,
        repo: params.repo,
        tag_name: params.tagName,
        name: params.name,
        body: params.description,
        draft: params.draft || false,
        prerelease: params.prerelease || false
      });
      return this.transformRelease(data);
    }
  };
}
```

### Gitea Provider

```typescript
class GiteaProvider implements IGitProvider {
  private client: GiteaClient;
  
  capabilities = {
    issues: true,
    projects: false, // Limited project support
    actions: true,   // Gitea Actions
    packages: true,
    pages: false,
    discussions: false,
    sponsorship: false,
    marketplace: false
  };
  
  authentication = {
    methods: ['token', 'basic', 'ssh'],
    tokenTypes: {
      'access_token': 'Personal access token',
      'oauth2': 'OAuth2 token',
      'sudo': 'Admin sudo token'
    }
  };
  
  specialFeatures = {
    // Gitea-specific features
    async createOrganization(params: CreateOrgParams): Promise<Organization> {
      const response = await this.client.post('/orgs', {
        username: params.name,
        full_name: params.fullName,
        description: params.description,
        website: params.website,
        location: params.location,
        visibility: params.visibility || 'public'
      });
      return response.data;
    },
    
    async mirrorRepository(params: MirrorParams): Promise<Repository> {
      const response = await this.client.post('/repos/migrate', {
        clone_addr: params.sourceUrl,
        repo_name: params.name,
        mirror: true,
        mirror_interval: params.interval || '24h',
        private: params.private || false,
        description: params.description
      });
      return response.data;
    },
    
    async enableLFS(repo: string): Promise<void> {
      await this.client.patch(`/repos/${repo}`, {
        has_lfs: true
      });
    }
  };
}
```

### GitLab Provider

```typescript
class GitLabProvider implements IGitProvider {
  private client: GitLabClient;
  
  capabilities = {
    issues: true,
    projects: true,
    pipelines: true,
    packages: true,
    pages: true,
    wiki: true,
    snippets: true,
    containerRegistry: true
  };
  
  authentication = {
    methods: ['token', 'oauth', 'impersonation'],
    tokenTypes: {
      'personal': 'Personal access token',
      'project': 'Project access token',
      'group': 'Group access token',
      'deploy': 'Deploy token'
    }
  };
  
  specialFeatures = {
    // GitLab-specific features
    async createPipeline(
      projectId: number,
      pipeline: PipelineDefinition
    ): Promise<Pipeline> {
      const response = await this.client.post(
        `/projects/${projectId}/pipeline`,
        {
          ref: pipeline.ref,
          variables: pipeline.variables
        }
      );
      return response.data;
    },
    
    async createMergeRequestApprovalRule(
      projectId: number,
      mergeRequestIid: number,
      rule: ApprovalRule
    ): Promise<void> {
      await this.client.post(
        `/projects/${projectId}/merge_requests/${mergeRequestIid}/approval_rules`,
        {
          name: rule.name,
          approvals_required: rule.approvalsRequired,
          user_ids: rule.userIds,
          group_ids: rule.groupIds
        }
      );
    },
    
    async enableAutoDevOps(projectId: number): Promise<void> {
      await this.client.put(`/projects/${projectId}`, {
        auto_devops_enabled: true,
        auto_devops_deploy_strategy: 'continuous'
      });
    }
  };
}
```

## CI/CD Providers

### Common CI/CD Interface

```typescript
interface ICICDProvider {
  // Pipeline Management
  createPipeline(params: CreatePipelineParams): Promise<Pipeline>;
  getPipeline(params: GetPipelineParams): Promise<Pipeline>;
  triggerPipeline(params: TriggerParams): Promise<PipelineRun>;
  cancelPipeline(params: CancelParams): Promise<void>;
  retryPipeline(params: RetryParams): Promise<PipelineRun>;
  listPipelines(params: ListPipelinesParams): Promise<Pipeline[]>;
  
  // Build Management
  getBuild(params: GetBuildParams): Promise<Build>;
  listBuilds(params: ListBuildsParams): Promise<Build[]>;
  getBuildLogs(params: GetLogsParams): Promise<BuildLogs>;
  downloadArtifacts(params: DownloadParams): Promise<Artifact[]>;
  
  // Job Management
  getJob(params: GetJobParams): Promise<Job>;
  rerunJob(params: RerunJobParams): Promise<Job>;
  listJobs(params: ListJobsParams): Promise<Job[]>;
  
  // Environment Management
  createEnvironment(params: CreateEnvParams): Promise<Environment>;
  updateEnvironment(params: UpdateEnvParams): Promise<Environment>;
  deleteEnvironment(params: DeleteEnvParams): Promise<void>;
  listEnvironments(params: ListEnvParams): Promise<Environment[]>;
  
  // Secret Management
  createSecret(params: CreateSecretParams): Promise<void>;
  updateSecret(params: UpdateSecretParams): Promise<void>;
  deleteSecret(params: DeleteSecretParams): Promise<void>;
  listSecrets(params: ListSecretsParams): Promise<SecretMetadata[]>;
}
```

### GitHub Actions Provider

```typescript
class GitHubActionsProvider implements ICICDProvider {
  private octokit: Octokit;
  
  capabilities = {
    matrixBuilds: true,
    parallelJobs: true,
    selfHostedRunners: true,
    reusableWorkflows: true,
    environments: true,
    deploymentProtection: true,
    oidcTokens: true
  };
  
  runnerTypes = {
    hosted: ['ubuntu-latest', 'windows-latest', 'macos-latest'],
    selfHosted: ['self-hosted', 'linux', 'x64']
  };
  
  specialFeatures = {
    async createWorkflowDispatch(
      owner: string,
      repo: string,
      workflow: string,
      inputs: Record<string, any>
    ): Promise<void> {
      await this.octokit.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflow,
        ref: 'main',
        inputs
      });
    },
    
    async enableOIDC(
      owner: string,
      repo: string,
      subject: string
    ): Promise<void> {
      // Configure OIDC for cloud providers
      await this.createSecret({
        repository: `${owner}/${repo}`,
        name: 'ACTIONS_ID_TOKEN_REQUEST_URL',
        value: 'https://token.actions.githubusercontent.com'
      });
    },
    
    async createCompositeAction(
      params: CompositeActionParams
    ): Promise<void> {
      // Create action.yml for composite action
      await this.createFile({
        repository: params.repository,
        path: 'action.yml',
        content: this.generateActionYaml(params)
      });
    }
  };
}
```

### Woodpecker CI Provider

```typescript
class WoodpeckerProvider implements ICICDProvider {
  private client: WoodpeckerClient;
  
  capabilities = {
    matrixBuilds: true,
    parallelSteps: true,
    plugins: true,
    multiPipeline: true,
    conditionalSteps: true,
    manualApproval: true,
    cloneFiltering: true
  };
  
  pluginRegistry = {
    official: [
      'docker', 'git', 'slack', 'email',
      's3', 'ssh', 'webhook', 'matrix'
    ],
    community: ['ansible', 'terraform', 'helm']
  };
  
  specialFeatures = {
    async createMultiPipeline(
      repo: string,
      pipelines: PipelineDefinition[]
    ): Promise<void> {
      // Create .woodpecker.yml with multiple pipelines
      const config = {
        pipelines: pipelines.reduce((acc, p) => ({
          ...acc,
          [p.name]: p.config
        }), {})
      };
      
      await this.updateConfig(repo, config);
    },
    
    async addTrustedRepo(repo: string): Promise<void> {
      await this.client.patch(`/repos/${repo}`, {
        trusted: true,
        gated: false
      });
    },
    
    async createCronJob(
      repo: string,
      cron: CronDefinition
    ): Promise<void> {
      await this.client.post(`/repos/${repo}/cron`, {
        name: cron.name,
        expr: cron.expression,
        branch: cron.branch || 'main',
        created_at: Date.now()
      });
    }
  };
}
```

### Jenkins Provider

```typescript
class JenkinsProvider implements ICICDProvider {
  private client: JenkinsClient;
  
  capabilities = {
    pipelines: true,
    multiBranch: true,
    blueOcean: true,
    distributed: true,
    plugins: true,
    groovyScripts: true,
    parameterized: true
  };
  
  specialFeatures = {
    async createJenkinsfile(
      params: JenkinsfileParams
    ): Promise<void> {
      const jenkinsfile = this.generateJenkinsfile(params);
      await this.createFile({
        repository: params.repository,
        path: 'Jenkinsfile',
        content: jenkinsfile
      });
    },
    
    async installPlugin(pluginId: string): Promise<void> {
      await this.client.post('/pluginManager/installNecessaryPlugins', {
        plugins: [pluginId]
      });
    },
    
    async createMultiBranchPipeline(
      params: MultiBranchParams
    ): Promise<void> {
      await this.client.post('/createItem', {
        name: params.name,
        mode: 'org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject',
        from: params.template,
        json: JSON.stringify({
          sources: [{
            source: {
              $class: 'GitSCMSource',
              remote: params.repository,
              credentialsId: params.credentialsId
            }
          }]
        })
      });
    }
  };
}
```

## Knowledge Base Providers

### Common Knowledge Base Interface

```typescript
interface IKnowledgeBaseProvider {
  // Space/Book Management
  createSpace(params: CreateSpaceParams): Promise<Space>;
  getSpace(params: GetSpaceParams): Promise<Space>;
  updateSpace(params: UpdateSpaceParams): Promise<Space>;
  deleteSpace(params: DeleteSpaceParams): Promise<void>;
  listSpaces(params: ListSpacesParams): Promise<Space[]>;
  
  // Page/Document Management
  createPage(params: CreatePageParams): Promise<Page>;
  getPage(params: GetPageParams): Promise<Page>;
  updatePage(params: UpdatePageParams): Promise<Page>;
  deletePage(params: DeletePageParams): Promise<void>;
  movePage(params: MovePageParams): Promise<Page>;
  listPages(params: ListPagesParams): Promise<Page[]>;
  
  // Content Management
  uploadAttachment(params: UploadParams): Promise<Attachment>;
  searchContent(params: SearchParams): Promise<SearchResults>;
  exportContent(params: ExportParams): Promise<ExportData>;
  importContent(params: ImportParams): Promise<ImportResult>;
  
  // Collaboration
  addComment(params: AddCommentParams): Promise<Comment>;
  shareContent(params: ShareParams): Promise<ShareResult>;
  getRevisionHistory(params: RevisionParams): Promise<Revision[]>;
}
```

### Notion Provider

```typescript
class NotionProvider implements IKnowledgeBaseProvider {
  private client: NotionClient;
  
  capabilities = {
    databases: true,
    templates: true,
    kanban: true,
    calendar: true,
    gallery: true,
    timeline: true,
    aiAssistant: true,
    publicSharing: true
  };
  
  blockTypes = [
    'paragraph', 'heading_1', 'heading_2', 'heading_3',
    'bulleted_list_item', 'numbered_list_item', 'toggle',
    'to_do', 'quote', 'divider', 'link_to_page',
    'code', 'image', 'video', 'file', 'pdf',
    'bookmark', 'equation', 'table', 'column_list'
  ];
  
  specialFeatures = {
    async createDatabase(params: DatabaseParams): Promise<Database> {
      return await this.client.databases.create({
        parent: { page_id: params.parentId },
        title: params.title,
        properties: params.schema,
        is_inline: params.inline || false
      });
    },
    
    async createTemplate(params: TemplateParams): Promise<Template> {
      // Create a template page
      const page = await this.createPage({
        title: params.name,
        parent: params.parentId,
        properties: params.defaultProperties,
        children: params.blocks
      });
      
      // Mark as template
      await this.updatePageProperty(page.id, 'template', true);
      return { ...page, isTemplate: true };
    },
    
    async queryDatabase(
      databaseId: string,
      query: DatabaseQuery
    ): Promise<QueryResult> {
      return await this.client.databases.query({
        database_id: databaseId,
        filter: query.filter,
        sorts: query.sorts,
        start_cursor: query.cursor,
        page_size: query.pageSize || 100
      });
    }
  };
}
```

### BookStack Provider

```typescript
class BookStackProvider implements IKnowledgeBaseProvider {
  private client: BookStackClient;
  
  capabilities = {
    books: true,
    chapters: true,
    markdown: true,
    wysiwyg: true,
    diagrams: true,
    permissions: true,
    audit: true,
    export: true
  };
  
  exportFormats = ['pdf', 'html', 'plaintext', 'markdown'];
  
  specialFeatures = {
    async createBook(params: BookParams): Promise<Book> {
      const response = await this.client.post('/books', {
        name: params.name,
        description: params.description,
        tags: params.tags
      });
      return response.data;
    },
    
    async createChapter(
      bookId: number,
      params: ChapterParams
    ): Promise<Chapter> {
      const response = await this.client.post('/chapters', {
        book_id: bookId,
        name: params.name,
        description: params.description,
        priority: params.order
      });
      return response.data;
    },
    
    async drawDiagram(params: DiagramParams): Promise<string> {
      // Generate diagram using draw.io integration
      const response = await this.client.post('/drawings', {
        name: params.name,
        type: params.type,
        data: params.data
      });
      return response.data.url;
    },
    
    async setPermissions(
      entityType: string,
      entityId: number,
      permissions: Permission[]
    ): Promise<void> {
      await this.client.put(
        `/permissions/${entityType}/${entityId}`,
        { permissions }
      );
    }
  };
}
```

### Confluence Provider

```typescript
class ConfluenceProvider implements IKnowledgeBaseProvider {
  private client: ConfluenceClient;
  
  capabilities = {
    spaces: true,
    pages: true,
    blogs: true,
    templates: true,
    macros: true,
    attachments: true,
    permissions: true,
    analytics: true
  };
  
  macroTypes = [
    'jira', 'code', 'info', 'warning', 'note',
    'table-of-contents', 'children', 'excerpt',
    'include', 'gallery', 'roadmap', 'timeline'
  ];
  
  specialFeatures = {
    async createSpaceFromTemplate(
      params: SpaceTemplateParams
    ): Promise<Space> {
      return await this.client.post('/spaces', {
        key: params.key,
        name: params.name,
        description: params.description,
        permissions: params.permissions,
        template: params.templateId
      });
    },
    
    async addMacro(
      pageId: string,
      macro: MacroDefinition
    ): Promise<void> {
      const currentContent = await this.getPage({ id: pageId });
      const updatedContent = this.insertMacro(
        currentContent.body,
        macro
      );
      
      await this.updatePage({
        id: pageId,
        content: updatedContent,
        version: currentContent.version + 1
      });
    },
    
    async createBlueprint(
      params: BlueprintParams
    ): Promise<Blueprint> {
      return await this.client.post('/blueprints', {
        name: params.name,
        description: params.description,
        template: params.template,
        metadata: params.metadata
      });
    }
  };
}
```

## Workflow Engine Providers

### Common Workflow Interface

```typescript
interface IWorkflowProvider {
  // Workflow Management
  createWorkflow(params: CreateWorkflowParams): Promise<Workflow>;
  getWorkflow(params: GetWorkflowParams): Promise<Workflow>;
  updateWorkflow(params: UpdateWorkflowParams): Promise<Workflow>;
  deleteWorkflow(params: DeleteWorkflowParams): Promise<void>;
  listWorkflows(params: ListWorkflowsParams): Promise<Workflow[]>;
  
  // Execution Management
  executeWorkflow(params: ExecuteParams): Promise<Execution>;
  getExecution(params: GetExecutionParams): Promise<Execution>;
  stopExecution(params: StopParams): Promise<void>;
  listExecutions(params: ListExecutionsParams): Promise<Execution[]>;
  
  // Node/Action Management
  getAvailableNodes(): Promise<NodeType[]>;
  validateWorkflow(workflow: Workflow): Promise<ValidationResult>;
  
  // Integration Management
  listIntegrations(): Promise<Integration[]>;
  configureIntegration(params: IntegrationConfig): Promise<void>;
}
```

### n8n Provider

```typescript
class N8NProvider implements IWorkflowProvider {
  private client: N8NClient;
  
  capabilities = {
    visual: true,
    code: true,
    branching: true,
    errorHandling: true,
    webhooks: true,
    scheduling: true,
    variables: true,
    credentials: true
  };
  
  nodeCategories = {
    core: ['Start', 'Function', 'Set', 'If', 'Switch', 'Merge'],
    communication: ['Email', 'Slack', 'Discord', 'Telegram'],
    data: ['Postgres', 'MySQL', 'MongoDB', 'Redis'],
    automation: ['HTTP Request', 'Webhook', 'Schedule', 'Execute'],
    transform: ['Code', 'Aggregate', 'Split', 'Sort']
  };
  
  specialFeatures = {
    async createWebhookWorkflow(
      params: WebhookWorkflowParams
    ): Promise<Workflow> {
      const workflow = {
        name: params.name,
        nodes: [
          {
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            position: [250, 300],
            parameters: {
              httpMethod: params.method,
              path: params.path,
              responseMode: 'onReceived',
              responseData: 'allEntries'
            }
          },
          ...params.processingNodes
        ],
        connections: this.generateConnections(params.processingNodes)
      };
      
      return await this.createWorkflow(workflow);
    },
    
    async createScheduledWorkflow(
      params: ScheduledWorkflowParams
    ): Promise<Workflow> {
      const workflow = {
        name: params.name,
        nodes: [
          {
            name: 'Schedule',
            type: 'n8n-nodes-base.scheduleTrigger',
            position: [250, 300],
            parameters: {
              rule: {
                interval: [{
                  field: params.cronExpression
                }]
              }
            }
          },
          ...params.actionNodes
        ],
        connections: this.generateConnections(params.actionNodes)
      };
      
      return await this.createWorkflow(workflow);
    }
  };
}
```

### Zapier Provider

```typescript
class ZapierProvider implements IWorkflowProvider {
  private client: ZapierClient;
  
  capabilities = {
    triggers: true,
    actions: true,
    filters: true,
    paths: true,
    formatter: true,
    storage: true,
    webhooks: true,
    scheduling: true
  };
  
  appDirectory = {
    popular: ['Gmail', 'Slack', 'Google Sheets', 'Trello'],
    categories: {
      'productivity': 100,
      'communication': 80,
      'sales': 60,
      'marketing': 70,
      'developer': 50
    }
  };
  
  specialFeatures = {
    async createZap(params: ZapParams): Promise<Zap> {
      return await this.client.post('/zaps', {
        title: params.name,
        trigger: params.trigger,
        actions: params.actions,
        filters: params.filters,
        enabled: params.enabled || false
      });
    },
    
    async addPath(
      zapId: string,
      paths: PathDefinition[]
    ): Promise<void> {
      await this.client.post(`/zaps/${zapId}/paths`, {
        paths: paths.map(p => ({
          name: p.name,
          filter: p.condition,
          actions: p.actions
        }))
      });
    },
    
    async testZap(zapId: string): Promise<TestResult> {
      return await this.client.post(`/zaps/${zapId}/test`, {
        load_samples: true,
        test_actions: true
      });
    }
  };
}
```

### Make (Integromat) Provider

```typescript
class MakeProvider implements IWorkflowProvider {
  private client: MakeClient;
  
  capabilities = {
    scenarios: true,
    modules: true,
    routers: true,
    aggregators: true,
    iterators: true,
    errorHandlers: true,
    dataStores: true,
    webhooks: true
  };
  
  moduleTypes = {
    apps: 1000,
    tools: ['Router', 'Iterator', 'Aggregator', 'Composer'],
    functions: ['Basic', 'Math', 'Text', 'Date', 'Array']
  };
  
  specialFeatures = {
    async createScenario(
      params: ScenarioParams
    ): Promise<Scenario> {
      return await this.client.post('/scenarios', {
        name: params.name,
        description: params.description,
        flow: params.modules,
        scheduling: params.schedule,
        sequential: params.sequential || false
      });
    },
    
    async addRouter(
      scenarioId: string,
      router: RouterConfig
    ): Promise<void> {
      await this.client.post(`/scenarios/${scenarioId}/modules`, {
        type: 'router',
        name: router.name,
        routes: router.routes.map(r => ({
          label: r.label,
          filter: r.condition,
          modules: r.modules
        }))
      });
    },
    
    async createDataStore(
      params: DataStoreParams
    ): Promise<DataStore> {
      return await this.client.post('/data-stores', {
        name: params.name,
        fields: params.schema,
        maxRecords: params.maxRecords || 10000
      });
    }
  };
}
```

## AI/LLM Providers

### Common AI/LLM Interface

```typescript
interface IAIProvider {
  // Completion/Generation
  complete(params: CompletionParams): Promise<CompletionResult>;
  stream(params: StreamParams): AsyncIterator<CompletionChunk>;
  
  // Chat
  chat(params: ChatParams): Promise<ChatResult>;
  streamChat(params: ChatParams): AsyncIterator<ChatChunk>;
  
  // Embeddings
  createEmbedding(params: EmbeddingParams): Promise<Embedding>;
  
  // Fine-tuning (if supported)
  createFineTune?(params: FineTuneParams): Promise<FineTuneJob>;
  getFineTune?(jobId: string): Promise<FineTuneJob>;
  
  // Model Management
  listModels(): Promise<Model[]>;
  getModel(modelId: string): Promise<Model>;
  
  // Usage/Billing
  getUsage(params: UsageParams): Promise<Usage>;
}
```

### OpenAI Provider

```typescript
class OpenAIProvider implements IAIProvider {
  private client: OpenAIClient;
  
  capabilities = {
    chat: true,
    completion: true,
    embeddings: true,
    fineTuning: true,
    functions: true,
    vision: true,
    audio: true,
    moderation: true
  };
  
  models = {
    chat: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    embedding: ['text-embedding-3-small', 'text-embedding-3-large'],
    vision: ['gpt-4-vision-preview'],
    audio: ['whisper-1', 'tts-1', 'tts-1-hd']
  };
  
  specialFeatures = {
    async chatWithFunctions(
      params: FunctionChatParams
    ): Promise<FunctionCallResult> {
      const response = await this.client.chat.completions.create({
        model: params.model,
        messages: params.messages,
        functions: params.functions,
        function_call: params.functionCall || 'auto'
      });
      
      if (response.choices[0].message.function_call) {
        return {
          type: 'function',
          function: response.choices[0].message.function_call
        };
      }
      
      return {
        type: 'message',
        content: response.choices[0].message.content
      };
    },
    
    async analyzeImage(
      imageUrl: string,
      prompt: string
    ): Promise<string> {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: imageUrl }
          ]
        }]
      });
      
      return response.choices[0].message.content;
    },
    
    async transcribeAudio(
      audioFile: Buffer,
      options: TranscriptionOptions
    ): Promise<Transcription> {
      return await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: options.language,
        response_format: options.format || 'json'
      });
    }
  };
}
```

### Anthropic Provider

```typescript
class AnthropicProvider implements IAIProvider {
  private client: AnthropicClient;
  
  capabilities = {
    chat: true,
    completion: true,
    streaming: true,
    contextWindow: 200000,
    vision: true,
    xmlMode: true,
    artifacts: true
  };
  
  models = {
    claude3: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    claude2: ['claude-2.1', 'claude-2.0'],
    instant: ['claude-instant-1.2']
  };
  
  specialFeatures = {
    async completeWithXML(
      params: XMLCompletionParams
    ): Promise<XMLResult> {
      const response = await this.client.messages.create({
        model: params.model,
        messages: params.messages,
        system: `You must respond in valid XML format. ${params.system}`,
        max_tokens: params.maxTokens
      });
      
      // Parse XML response
      return this.parseXMLResponse(response.content);
    },
    
    async generateWithArtifacts(
      params: ArtifactParams
    ): Promise<ArtifactResult> {
      const response = await this.client.messages.create({
        model: params.model,
        messages: [
          {
            role: 'user',
            content: `Generate ${params.artifactType}: ${params.prompt}`
          }
        ],
        metadata: {
          artifacts: true,
          artifact_type: params.artifactType
        }
      });
      
      return {
        content: response.content,
        artifacts: response.artifacts || []
      };
    },
    
    async analyzeDocument(
      document: string,
      analysis: AnalysisParams
    ): Promise<DocumentAnalysis> {
      const response = await this.client.messages.create({
        model: 'claude-3-opus',
        messages: [{
          role: 'user',
          content: `Analyze this document:\n\n${document}\n\nAnalysis required: ${analysis.type}`
        }],
        max_tokens: 4096
      });
      
      return this.parseAnalysis(response.content);
    }
  };
}
```

### Ollama Provider

```typescript
class OllamaProvider implements IAIProvider {
  private client: OllamaClient;
  
  capabilities = {
    localModels: true,
    customModels: true,
    streaming: true,
    embeddings: true,
    multiModal: true,
    quantization: true,
    gpuAcceleration: true
  };
  
  modelFormats = ['GGUF', 'GGML', 'PyTorch', 'Safetensors'];
  
  specialFeatures = {
    async pullModel(modelName: string): Promise<void> {
      await this.client.pull({
        name: modelName,
        stream: true
      });
    },
    
    async createCustomModel(
      params: CustomModelParams
    ): Promise<void> {
      const modelfile = `
FROM ${params.baseModel}

PARAMETER temperature ${params.temperature || 0.7}
PARAMETER top_k ${params.topK || 40}
PARAMETER top_p ${params.topP || 0.9}

SYSTEM ${params.systemPrompt}

${params.template ? `TEMPLATE ${params.template}` : ''}
      `;
      
      await this.client.create({
        name: params.name,
        modelfile: modelfile
      });
    },
    
    async runWithGPU(
      params: GPUCompletionParams
    ): Promise<CompletionResult> {
      return await this.client.generate({
        model: params.model,
        prompt: params.prompt,
        options: {
          num_gpu: params.gpuLayers || -1,
          num_thread: params.threads || 4,
          num_batch: params.batchSize || 512
        }
      });
    },
    
    async embedLocal(
      texts: string[],
      model: string = 'nomic-embed-text'
    ): Promise<number[][]> {
      const embeddings = [];
      
      for (const text of texts) {
        const response = await this.client.embeddings({
          model,
          prompt: text
        });
        embeddings.push(response.embedding);
      }
      
      return embeddings;
    }
  };
}
```

## Provider Comparison Matrix

### Git Providers

| Feature | GitHub | Gitea | GitLab | Bitbucket |
|---------|--------|-------|--------|-----------|
| Public/Private Repos | ✅ | ✅ | ✅ | ✅ |
| Organizations | ✅ | ✅ | ✅ | ✅ |
| Pull/Merge Requests | ✅ | ✅ | ✅ | ✅ |
| Issues | ✅ | ✅ | ✅ | ✅ |
| Wiki | ✅ | ✅ | ✅ | ✅ |
| CI/CD Integration | ✅ (Actions) | ✅ (Actions) | ✅ (CI/CD) | ✅ (Pipelines) |
| Package Registry | ✅ | ✅ | ✅ | ❌ |
| Pages/Sites | ✅ | ❌ | ✅ | ❌ |
| Project Boards | ✅ | ⚠️ | ✅ | ✅ |
| Code Review | ✅ | ✅ | ✅ | ✅ |
| Branch Protection | ✅ | ✅ | ✅ | ✅ |
| Webhooks | ✅ | ✅ | ✅ | ✅ |
| API Rate Limits | 5000/hour | Configurable | Configurable | 1000/hour |
| Self-Hosted | ❌ | ✅ | ✅ | ⚠️ |
| Cost | Free/Paid | Free | Free/Paid | Free/Paid |

### CI/CD Providers

| Feature | GitHub Actions | Woodpecker | Jenkins | GitLab CI |
|---------|---------------|------------|---------|-----------|
| YAML Config | ✅ | ✅ | ⚠️ | ✅ |
| Matrix Builds | ✅ | ✅ | ✅ | ✅ |
| Parallel Jobs | ✅ | ✅ | ✅ | ✅ |
| Self-Hosted Runners | ✅ | ✅ | ✅ | ✅ |
| Containers | ✅ | ✅ | ✅ | ✅ |
| Caching | ✅ | ✅ | ✅ | ✅ |
| Artifacts | ✅ | ✅ | ✅ | ✅ |
| Secrets | ✅ | ✅ | ✅ | ✅ |
| Schedules | ✅ | ✅ | ✅ | ✅ |
| Manual Approval | ✅ | ✅ | ✅ | ✅ |
| Plugins/Extensions | ⚠️ | ✅ | ✅ | ⚠️ |
| UI Dashboard | ✅ | ✅ | ✅ | ✅ |
| API Access | ✅ | ✅ | ✅ | ✅ |
| Cost | Usage-based | Free | Free | Free/Paid |

### Knowledge Base Providers

| Feature | Notion | BookStack | Confluence | Wiki.js |
|---------|--------|-----------|------------|---------|
| WYSIWYG Editor | ✅ | ✅ | ✅ | ✅ |
| Markdown | ✅ | ✅ | ⚠️ | ✅ |
| Templates | ✅ | ⚠️ | ✅ | ✅ |
| Databases | ✅ | ❌ | ❌ | ❌ |
| Permissions | ✅ | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ | ✅ |
| API Access | ✅ | ✅ | ✅ | ✅ |
| Attachments | ✅ | ✅ | ✅ | ✅ |
| Version History | ✅ | ✅ | ✅ | ✅ |
| Export Formats | Limited | ✅ | ✅ | ✅ |
| Diagrams | ⚠️ | ✅ | ✅ | ✅ |
| Self-Hosted | ❌ | ✅ | ⚠️ | ✅ |
| Cost | Free/Paid | Free | Paid | Free |

### AI/LLM Providers

| Feature | OpenAI | Anthropic | Ollama | Cohere |
|---------|--------|-----------|--------|---------|
| Chat Completion | ✅ | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ | ✅ |
| Functions/Tools | ✅ | ✅ | ⚠️ | ✅ |
| Vision | ✅ | ✅ | ⚠️ | ❌ |
| Embeddings | ✅ | ❌ | ✅ | ✅ |
| Fine-tuning | ✅ | ❌ | ✅ | ✅ |
| Context Window | 128k | 200k | Model-dependent | 128k |
| Local Deployment | ❌ | ❌ | ✅ | ❌ |
| Audio | ✅ | ❌ | ⚠️ | ❌ |
| Code Generation | ✅ | ✅ | ✅ | ✅ |
| API Rate Limits | Tiered | Tiered | None | Tiered |
| Cost | Usage-based | Usage-based | Free | Usage-based |

Legend:
- ✅ Full support
- ⚠️ Partial support
- ❌ No support

---

This comprehensive provider specification enables the MosAIc orchestration platform to support a wide variety of services while maintaining a consistent interface across providers.