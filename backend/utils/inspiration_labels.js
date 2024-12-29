import * as fs from 'node:fs';

import * as DB from './db.js';

export async function RegenLabels() {
    console.log('regenerating the labels');
    let labels = {};
    (await DB.GetAllFullLabelPaths()).forEach(path => {
        const split = path.path.split('/');
        if(split.length == 1) labels[split[0]] = { id: path.id, labels: [] };
        else labels[split[0]].labels.push({ id: path.id, name: path.name });
    });
    fs.writeFileSync('./data/labels.json', JSON.stringify({ labels: labels, amount_pages: 1 }));
}