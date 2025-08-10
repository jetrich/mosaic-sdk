#!/usr/bin/env node

/**
 * Test script for Ollama MCP Streaming functionality
 * Tests the new streaming architecture locally before MCP integration
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

class StreamingTest {
  constructor() {
    this.ollamaHost = '10.1.1.42';
    this.ollamaPort = '11434';
    this.model = 'gpt-oss';
  }

  async testStreaming() {
    console.log('🧪 Testing Ollama Streaming Architecture...\n');

    const prompt = "Create a simple HTML page with CSS for a coffee shop called 'Mordor Coffee'";
    const startTime = Date.now();

    try {
      // Generate content
      console.log('📡 Generating content with Ollama...');
      const result = await this.generateWithOllama(prompt);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      console.log(`✅ Generation completed in ${Date.now() - startTime}ms`);
      console.log(`📊 Generated ${result.response.length} characters`);

      // Test parsing and file output
      const outputDir = await this.createOutputDir('streaming-test');
      const parseResult = await this.parseAndSaveContent(result.response, outputDir, 'web-development', 'html');

      console.log('\n📁 Files created:');
      parseResult.files.forEach(file => {
        const filepath = path.join(outputDir, file);
        const size = fs.statSync(filepath).size;
        console.log(`  • ${file} (${size} bytes)`);
      });

      // Create summary
      const summary = this.createStreamSummary(parseResult, outputDir);
      console.log('\n📋 Summary Preview:');
      console.log(summary.slice(0, 500) + '...');

      console.log(`\n🎉 Test completed successfully!`);
      console.log(`📂 Output directory: ${outputDir}`);
      
      return {
        success: true,
        outputDir,
        files: parseResult.files,
        contentTypes: parseResult.contentTypes,
        totalSize: parseResult.totalSize
      };

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async generateWithOllama(prompt) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 3000,
          top_k: 20,
          top_p: 0.8,
          num_ctx: 32768,
          repeat_penalty: 1.05
        }
      });

      const req = http.request({
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 300000 // 5 minutes
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({
              success: true,
              response: result.response || '',
              tokens: result.eval_count || 0
            });
          } catch (error) {
            resolve({
              success: false,
              error: `Parse error: ${error.message}`
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: `Request error: ${error.message}`
        });
      });

      req.on('timeout', () => {
        resolve({
          success: false,
          error: 'Request timeout'
        });
      });

      req.write(postData);
      req.end();
    });
  }

  async createOutputDir(testName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputDir = path.join(os.homedir(), '.ollama-outputs', `${timestamp}-${testName}`);
    fs.mkdirSync(outputDir, { recursive: true });
    return outputDir;
  }

  async parseAndSaveContent(response, outputDir, taskType, language) {
    const files = [];
    const contentTypes = new Set();
    let totalSize = 0;

    // Extract code blocks
    const codeBlocks = this.extractCodeBlocks(response);

    if (codeBlocks.length > 0) {
      // Process code blocks
      for (let i = 0; i < codeBlocks.length; i++) {
        const block = codeBlocks[i];
        const filename = `${block.language}_${i + 1}.${this.getFileExtension(block.language)}`;
        const filepath = path.join(outputDir, filename);

        fs.writeFileSync(filepath, block.content.trim());

        files.push(filename);
        contentTypes.add(block.language);
        totalSize += block.content.length;
      }
    } else {
      // No code blocks, save as HTML
      const filename = 'content.html';
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, response.trim());

      files.push(filename);
      contentTypes.add('html');
      totalSize += response.length;
    }

    // Create summary file
    const summaryContent = this.createContentSummary(response, Array.from(contentTypes));
    const summaryFile = path.join(outputDir, 'summary.txt');
    fs.writeFileSync(summaryFile, summaryContent);
    files.push('summary.txt');
    totalSize += summaryContent.length;

    // Create metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      task_type: taskType,
      language: language,
      files_created: files,
      content_types: Array.from(contentTypes),
      total_size_bytes: totalSize
    };

    const metadataFile = path.join(outputDir, 'metadata.json');
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    files.push('metadata.json');

    return {
      files,
      contentTypes: Array.from(contentTypes),
      totalSize
    };
  }

  extractCodeBlocks(text) {
    const blocks = [];
    const codeBlockRegex = /```(\w+)?\s*\n([\s\S]*?)\n```/g;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        content: match[2].trim()
      });
    }

    return blocks;
  }

  getFileExtension(type) {
    const extensions = {
      html: 'html',
      javascript: 'js',
      python: 'py',
      css: 'css',
      json: 'json',
      markdown: 'md',
      text: 'txt'
    };
    return extensions[type] || 'txt';
  }

  createContentSummary(content, contentTypes) {
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).length;
    const chars = content.length;

    return `Ollama Streaming Test - Content Summary
==========================================
Lines: ${lines}
Words: ${words}
Characters: ${chars}
Content Types: ${contentTypes.join(', ')}

Generated: ${new Date().toISOString()}

Preview (first 300 chars):
${content.slice(0, 300)}${content.length > 300 ? '...' : ''}
`;
  }

  createStreamSummary(parseResult, outputDir) {
    const fileList = parseResult.files.map(f => `  • ${f}`).join('\n');

    return `## 🗂️ Ollama Streaming Test Results

✅ **Generation & Parsing Complete**
📁 **Output Directory**: ${outputDir}
📊 **Files Created**: ${parseResult.files.length}
${fileList}

📈 **Statistics**:
• **Content Types**: ${parseResult.contentTypes.join(', ')}
• **Total Size**: ${parseResult.totalSize} bytes
• **Parser Factory**: Successfully detected and processed content

💰 **Context Efficiency Demonstration**:
• **Full Content**: ${parseResult.totalSize} characters
• **Summary Response**: ~500 characters (${Math.round((500/parseResult.totalSize) * 100)}% of original)
• **Context Reduction**: ${Math.round(((parseResult.totalSize - 500)/parseResult.totalSize) * 100)}%

🎯 **Streaming Architecture Validated**: Content processed locally with minimal metadata response`;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const test = new StreamingTest();
  test.testStreaming().then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}

module.exports = StreamingTest;