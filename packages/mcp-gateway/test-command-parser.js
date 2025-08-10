#!/usr/bin/env node

// Test command parser directly
import { CommandRouter } from './dist/commands/CommandRouter.js';

const router = new CommandRouter();

const commands = [
  '/help',
  '/status',
  '/project list',
  '/project create "MosAIc v2"',
  '/task create "Implement login system"',
  'show me all projects',
  'create a new task called "Fix auth bug"',
  'what is the current status?'
];

console.log('Testing Command Parser\n');

for (const cmd of commands) {
  console.log(`\nInput: "${cmd}"`);
  const parsed = router.parseCommand(cmd);
  console.log('Parsed:', JSON.stringify(parsed, null, 2));
  
  const message = router.commandToMessage(parsed);
  console.log('Message:', JSON.stringify(message, null, 2));
}