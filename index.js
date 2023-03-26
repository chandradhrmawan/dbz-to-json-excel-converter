import { Parser } from '@filip96/node-dbf';
import unzipper from "unzipper";
import fs from "fs";
import json2xls from 'json2xls';
import path from "node:path";

const convertDbzToJson = async (dirPath) => {
    fs.readdirSync(dirPath).forEach(async (file) => {
        let fullPath = `${dirPath}/${file}`;
        let splitPath = file.split('.');
        await parseFile(fullPath, splitPath[0]);
    });
}

const convertJsonToXlsx = async (dirPath,) => {
    fs.readdirSync(dirPath).forEach(async (file) => {
        let fullPath = `${dirPath}/${file}`;
        let rawdata = fs.readFileSync(fullPath);
        let parseData = JSON.parse(rawdata);
        let xls = json2xls(parseData);
        let splitPath = file.split('.');
        fs.writeFileSync(`./excel/${splitPath[0]}.xls`, xls, 'binary');
    });
}

const zipReader = async (filePath) => {
    try {
        const zip = fs.createReadStream(filePath).pipe(unzipper.Parse({ forceStream: true }));
        for await (const entry of zip) {
            const fileName = entry.path;
            entry.pipe(fs.createWriteStream(`./unzip/${fileName}`));
        }
    } catch (e) {
        console.log(`Something went wrong. ${e}`);
    }
}

const parseFile = async (filePath, fileName) => {

    let parser = new Parser(filePath);
    let jsonData = []

    parser.on('start', function (p) {
        console.log('dBase file parsing has started');
    });

    parser.on('header', function (h) {
        console.log('dBase file header has been parsed');
    });

    parser.on('record', function (record) {
        jsonData.push(record)
    });

    parser.on('end', function (p) {
        let data = JSON.stringify(jsonData);
        fs.writeFileSync(`./json/${fileName}.json`, data);
        console.log('Finished parsing the dBase file');
    });
    parser.parse();
}

const clearDir = async (directory = './unzip') => {
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            fs.unlink(path.join(directory, file), (err) => {
                if (err) throw err;
            });
        }
    });
}


async function main(name) {

    await Promise.all([
        clearDir('./unzip'),
        clearDir('./json'),
        clearDir('./excel')
    ])

    await zipReader(`D:/POK-REFF/uploader POK/${name}.zip`); /* unzip zip file */
    await convertDbzToJson('./unzip'); /* conver dbz to json */

    setTimeout(() => {
        convertJsonToXlsx('./json'); /* conver json to excel */
    }, 1000);

}

await main('Satker_16_403481_20230317_22')