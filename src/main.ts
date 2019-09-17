import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as xpath from 'xpath-ts';
import { DOMParserImpl as dom } from 'xmldom-ts';

// https://help.github.com/ja/articles/about-github-actions
// https://help.github.com/ja/articles/virtual-environments-for-github-actions
// https://help.github.com/ja/categories/automating-your-workflow-with-github-actions
// https://help.github.com/ja/articles/software-in-virtual-environments-for-github-actions
// https://help.github.com/ja/articles/contexts-and-expression-syntax-for-github-actions

export async function run() {
    try {
      const log4j2xml = path.join(process.env.GITHUB_WORKSPACE!, core.getInput('REPO'), 'src/main/resources/log4j2.xml');
      if(!fs.existsSync(log4j2xml)) {
        throw Error(`log4j2.xml doesn\'t exists at ${log4j2xml}`);
      }
      
      // 0. load log4j2.xml
      const content = fs.readFileSync(log4j2xml, {encoding: 'utf8'});
      const doc = new dom().parseFromString(content);
  
      // 1. find <Kafka /> Elements to get appender names
      const names = (xpath.select("//Kafka", doc) as Element[]).map((tag) => tag.getAttribute('name'));
      console.log('<Kafka />:', names.join(', '));
      
      // 2. find <Async /> Elements which has <AppenderRef /> references Appender 1.
      const asyncs = names.flatMap((name) => xpath.select(`//AppenderRef[@ref='${name}']`, doc) as Element[])
                          .flatMap((ref) => ref.parentNode as Element);
      console.log('<Async />:', asyncs.map((v) => v.getAttribute('name')).join(', '))
      
      // 3. check if 2. has attributes blocking=false, shutdownTimeout=25000
      const blockingAsyncAppenders = asyncs.filter((asyncAppender) => asyncAppender.getAttribute('blocking') === null || asyncAppender.getAttribute('blocking') !== 'false')
      if (blockingAsyncAppenders.length > 0) {
        throw Error(`async appender should be false. [${blockingAsyncAppenders.map((appender) => `${appender.getAttribute('name')}.blocking=${appender.getAttribute('blocking')}`).join(', ')}]`);
      }
  
    } catch (error) {
      core.setFailed(error.message);
    }
}
  
run();