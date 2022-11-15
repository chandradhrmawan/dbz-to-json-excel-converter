import express from "express";
import { Parser } from '@filip96/node-dbf';
import unzipper from "unzipper";
import fs from "fs";
import json2xls from 'json2xls';
// import jsonData from "./json/dbzd_akun.json";

const app = express()
const port = 3000

app.get('/', (req, res) => {
    // getAlldir('D:/POK-APP/dbf-reader/json', 'json');
    res.json('success')
})

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})

const getAlldir = async (dirPath, tpye = 'dbz') => {
    fs.readdirSync(dirPath).forEach(file => {
        let fullPath = `${dirPath}/${file}`;
        if (tpye == 'dbz') {
            let splitPath = file.split('.');
            parseFile(fullPath, splitPath[0]);
        } else {
            let rawdata = fs.readFileSync(fullPath);
            let parseData = JSON.parse(rawdata);
            let xls = json2xls(parseData);
            let splitPath = file.split('.');
            fs.writeFileSync(`D:/POK-APP/dbf-reader/excel/${splitPath[0]}.xls`, xls, 'binary');
        }
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

const parseFile = (filePath, fileName) => {

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

// await zipReader('D:/POK-REFF/uploader POK/Satker_05_498623_20221110_22.zip'); /* unzip zip file */
// parseFile('D:/POK/Satker_05_498631_20220726_22_awalOK/dbzd_akun.dbz', 'dbzd_akun'); /* testing conver dbz to json zip file */
// getAlldir('D:/POK-APP/dbf-reader/unzip','dbz'); /* conver dbz to json */
getAlldir('D:/POK-APP/dbf-reader/json', 'json'); /* conver json to excel */