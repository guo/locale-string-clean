/* eslint-disable */

// clean up strings
// 1. find strings in source code. if not found, remove from en.yaml
// 2. copy all existing strings from en to other supported locales and keep the translation if any.
// 3. if no tranlsation, create a new string with english copy.
// TODO: include this script in build to make it fully automatic.
// TODO: auto create an pull translation strings from public repo.
// limitation: use find and grep cmd that only works in linux and mac.
const yaml = require('js-yaml');
const fs = require('fs');
const util = require('util');
const console = require('console');

const exec = util.promisify(require('child_process').exec);

const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'ko', 'ru', 'it'];

// return true means found
async function find(str) {
  // return true;
  if (str.match(/\.keep$/)) {
    console.log('matched keep, ignored', str);
    return true;
  }
  try {
    await exec(`grep ${str} src/ -iRsl`);
    return true;
  } catch (e) {
    return false;
  }
}

async function main() {
  // Get document, or throw exception on error
  let no_delete = false;
  process.argv.forEach(function (val, index, array) {
    if (val==='--no-delete') {
      no_delete = true;
    }
  });

  try {
    const old = {};
    const cc_str = {}; // cleaned string
    for (const lang of SUPPORTED_LANGUAGES) {
      old[lang] = yaml.safeLoad(fs.readFileSync(`translations/${lang}.yaml`, 'utf8'));
      cc_str[lang] = {};
      cc_str[lang]['about.this.file'] = 'Strings in different locales are auto-generated and maintained by locale_strings.js.'
    }
    // sort
    const keys = Object.keys(old.en).sort();
    for (const key of keys) {
      console.log(`looking for ${key}`);
      const found = no_delete? true : await find(key);
      if (found) {
        console.log('found. adding to all lang');
        for (const lang of SUPPORTED_LANGUAGES) {
          cc_str[lang][key] = old.en[key];
          if (old[lang][key] && old[lang][key] !== key) { // key = value means the string does not exists
            // key !== value means the string has been translated.
            cc_str[lang][key] = old[lang][key];
          }
        }
      }
    }
    for (const lang of SUPPORTED_LANGUAGES) {
      fs.writeFileSync(`translations/${lang}.yaml`, yaml.dump(cc_str[lang]), 'utf8');
    }
  } catch (e) {
    console.log(e);
  }
}

main();
