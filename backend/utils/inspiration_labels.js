import * as fs from 'node:fs';

import * as DB from './db.js';

export async function RegenLabels() {
    console.log('regenerating the labels');
    const fullPaths = await DB.GetAllFullLabelPaths();
    let labels = {};
    fullPaths.forEach(path => {
        const split = path.path.split('/');
        if(split.length == 1) labels[split[0]] = { id: path.id, name:path.name, labels: [] };
        else labels[split[0]].labels.push({ id: path.id, name: path.name });
    });
    let transformingLabels = [];
    Object.entries(labels).forEach(([categoryName, data]) => {
        transformingLabels.push({...data, name: categoryName});
    });

    const positions = fullPaths.reduce((accumulator, label) => {
        accumulator[label.id] = label.position;
        return accumulator;
    }, {});
    transformingLabels.sort((a, b) => positions[a.id] - positions[b.id] );
    transformingLabels.forEach((category) => {
        category.labels.sort((a,b) => positions[a.id] - positions[b.id]);
    })
    fs.writeFileSync('./data/labels.json', JSON.stringify({ labels: transformingLabels, amount_pages: 1 }));
}