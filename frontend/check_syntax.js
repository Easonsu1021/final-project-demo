import fs from 'fs';
import { parse } from '@babel/parser';
const code = fs.readFileSync('c:/Users/eason/OneDrive/орн▒/final-project-demo-main/frontend/src/components/AICoDesign/AICoDesign.jsx', 'utf-8');
try {
    parse(code, {
        sourceType: 'module',
        plugins: ['jsx']
    });
    console.log("No syntax errors found!");
} catch (e) {
    console.error("Syntax Error exactly at: ", e.loc);
    console.error(e.message);
    const lines = code.split('\n');
    const errLine = e.loc.line - 1;
    console.log("Line " + (errLine + 1) + ": " + lines[errLine]);
}
