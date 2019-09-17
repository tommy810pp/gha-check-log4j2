"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const xpath = __importStar(require("xpath-ts"));
const xmldom_ts_1 = require("xmldom-ts");
// https://help.github.com/ja/articles/about-github-actions
// https://help.github.com/ja/articles/virtual-environments-for-github-actions
// https://help.github.com/ja/categories/automating-your-workflow-with-github-actions
// https://help.github.com/ja/articles/software-in-virtual-environments-for-github-actions
// https://help.github.com/ja/articles/contexts-and-expression-syntax-for-github-actions
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const log4j2xml = path.join(process.env.GITHUB_WORKSPACE, core.getInput('REPOSITORY'), 'src/main/resources/log4j2.xml');
            if (!fs.existsSync(log4j2xml)) {
                throw Error(`log4j2.xml doesn\'t exists at ${log4j2xml}`);
            }
            // 0. load log4j2.xml
            const content = fs.readFileSync(log4j2xml, { encoding: 'utf8' });
            const doc = new xmldom_ts_1.DOMParserImpl().parseFromString(content);
            // 1. find <Kafka /> Elements to get appender names
            const names = xpath.select("//Kafka", doc).map((tag) => tag.getAttribute('name'));
            console.log('<Kafka />:', names.join(', '));
            // 2. find <Async /> Elements which has <AppenderRef /> references Appender 1.
            const asyncs = names.flatMap((name) => xpath.select(`//AppenderRef[@ref='${name}']`, doc))
                .flatMap((ref) => ref.parentNode);
            console.log('<Async />:', asyncs.map((v) => v.getAttribute('name')).join(', '));
            // 3. check if 2. has attributes blocking=false, shutdownTimeout=25000
            const blockingAsyncAppenders = asyncs.filter((asyncAppender) => asyncAppender.getAttribute('blocking') === null || asyncAppender.getAttribute('blocking') !== 'false');
            if (blockingAsyncAppenders.length > 0) {
                throw Error(`async appender should be false. [${blockingAsyncAppenders.map((appender) => `${appender.getAttribute('name')}.blocking=${appender.getAttribute('blocking')}`).join(', ')}]`);
            }
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
exports.run = run;
run();
