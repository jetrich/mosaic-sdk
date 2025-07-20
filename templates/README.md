# MosAIc SDK Templates

This directory contains reusable templates, scaffolding, and configuration files for the MosAIc ecosystem.

## 📁 Directory Structure

### `infrastructure/`
Templates for infrastructure components:
- **database/** - Database configuration templates
- **networking/** - Network setup templates  
- **monitoring/** - Monitoring stack templates

### `development/`
Development-focused templates:
- **ci-cd/** - CI/CD pipeline templates
- **containers/** - Docker and Kubernetes templates
- **projects/** - Complete project scaffolding

### `configuration/`
Configuration templates:
- **environment/** - Environment variable templates
- **application/** - Application configuration templates
- **security/** - Security configuration templates

### `documentation/`
Documentation templates:
- **project-docs/** - Standard project documentation
- **technical-specs/** - Technical specification templates
- **operational/** - Operational documentation templates

## 🎯 Usage Patterns

### Direct Copy
```bash
# Copy template to project
cp templates/development/ci-cd/node-pipeline.yml .woodpecker.yml
```

### Template Inheritance
```yaml
# Extend base template
include:
  - templates/development/ci-cd/base-pipeline.yml

# Override specific steps
steps:
  custom-step:
    # Your customizations
```

### Project Scaffolding
```bash
# Create new project from template
cp -r templates/development/projects/node-typescript/ my-new-project/
```

## 🔧 Template Development

- All templates should be documented with usage examples
- Use `.template.ext` suffix where appropriate
- Include variable placeholders for customization
- Test templates before committing
- Follow DRY principles with inheritance patterns

## 📚 Related Documentation

- [Organizational Structure](../ORGANIZATIONAL-STRUCTURE.md)
- [CI/CD Pipeline Templates](../docs/engineering/cicd-handbook/pipeline-setup/03-pipeline-templates.md)
- [Project Scaffolding Guide](../docs/engineering/getting-started/quick-start/01-first-project.md)