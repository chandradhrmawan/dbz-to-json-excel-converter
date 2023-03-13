import express, { json } from "express";
import { Parser } from '@filip96/node-dbf';
import unzipper from "unzipper";
import fs from "fs";
import json2xls from 'json2xls'
import { uuid } from 'uuidv4';

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

const toSql = async () => {
    let data = await fs.readFileSync('./json/tr_linkdesc.json')
    let jsonData = JSON.parse(data)

    let postData = []
    let avoidData = ['@sequenceNumber', '@deleted', '\r', '', '_NullFlags']
    for (let index = 0; index < jsonData.length; index++) {
        avoidData.map(row => delete jsonData[index][row])
        jsonData[index]['ACTIVE_IND'] = 'Y'
        jsonData[index]['UID'] = uuid()
        postData.push(jsonData[index])
    }

    // generate to sql text
    let sqlData = []
    for (let index = 0; index < postData.length; index++) {
        // const element = postData[index];
        let sqlText = `INSERT INTO pok_online.tr_linkdesc (`
        for (const key in postData[index]) {
            if (Object.hasOwnProperty.call(postData[index], key)) {
                sqlText += `${key},`
            }
        }
        sqlText = sqlText.slice(0, -1);
        sqlText += `) VALUES(`

        for (const key in postData[index]) {
            if (Object.hasOwnProperty.call(postData[index], key)) {
                let text = postData[index][key] ? postData[index][key].toString() : '';
                text = text.replace("'", "");
                sqlText += `'${text}',`
            }
        }

        sqlText = sqlText.slice(0, -1);
        sqlText += `)`

        sqlData.push(sqlText)
    }

    fs.writeFile('D:/POK-APP/dbf-reader/sql/tr_linkdesc.sql', sqlData.join(`;\n`), 'ascii',
        function (err) {
            if (err) throw err;
            console.log("Data is written to file successfully.")
        });
}



async function main(name) {
    // await zipReader(`D:/POK-REFF/uploader POK/${name}.zip`); /* unzip zip file */
    // await getAlldir('D:/POK-APP/dbf-reader/unzip', 'dbz'); /* conver dbz to json */
    await getAlldir('D:/POK-APP/dbf-reader/json', 'json'); /* conver json to excel */
}

await main('Satker_08_498580_20230228_22')


// parseFile('D:/POK/Satker_05_498631_20220726_22_awalOK/dbzd_akun.dbz', 'dbzd_akun'); /* testing conver dbz to json zip file */
// getAlldir('D:/POK-APP/dbf-reader/json', 'json'); /* convert single df to excel */
// toSql()