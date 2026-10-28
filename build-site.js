import fs from 'fs';

fs.rmSync('./site-dist', {recursive: true, force: true});
fs.cpSync('./site', './site-dist', {recursive: true});

console.log('Site ready to deploy: site-dist/');
