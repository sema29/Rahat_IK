import { Injectable } from '@nestjs/common';
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const https = require("https");

mongoose.set("strictQuery", true);


mongoose.connect("mongodb+srv://semanurboz5:169978@work.ge9ke23.mongodb.net/work");

const db = mongoose.connection;

const Schema = mongoose.Schema;

const dataschema = new Schema({
 
  id: { type: Number },
  hesap_kodu: { type: String },
  hesap_adi :{ type: String },
  tipi:{ type: String },
  ust_hesap_id :{ type: Number },
  borc :{ type: Number },
  alacak:{ type: Number },
  borc_sistem:{ type: Number },
  alacak_sistem:{ type: Number },
  alacak_doviz:{ type: Number },
  borc_islem_doviz:{ type: Number },
  alacak_islem_doviz:{ type: Number },
  birim_adi:{ type: String },
  bakiye_sekli:{ type: Number },
  aktif:{ type: Number },
  dovizkod:{ type: Number },
});

const Data = mongoose.model("User", dataschema);

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

async function getApiData() {
  const apiUrl =
    "https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/layouts/testdb/records/1 ";
  try {
    const token = await getToken();

    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },

      agent: httpsAgent,
      body: '{"fieldData": {},   "script" : "getData"}',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const parsedData = JSON.parse(data.response.scriptResult);

    for (const datum of parsedData) {
      const newData = new Data({
        id: datum.id,
        hesap_kodu: datum.hesap_kodu,
        hesap_adi: datum.hesap_adi,
        tipi: datum.tipi,
        ust_hesap_id: datum.ust_hesap_id,
        borc: datum.borc,
        alacak: datum.alacak,
        borc_sistem: datum.borc_sistem,
        alacak_sistem: datum.alacak_sistem,
        alacak_doviz: datum.alacak_doviz,
        borc_islem_doviz: datum.borc_islem_doviz,
        alacak_islem_doviz: datum.alacak_islem_doviz,
        birim_adi: datum.birim_adi,
        bakiye_sekli: datum.bakiye_sekli,
        aktif: datum.aktif,
        dovizkod: datum.dovizkod,
      });

      const filter = { id: datum.id };
      const updateData = {
        $set: {
          hesap_kodu: datum.hesap_kodu,
          hesap_adi: datum.hesap_adi,
          tipi: datum.tipi,
          ust_hesap_id: datum.ust_hesap_id,
          borc: datum.borc,
          alacak: datum.alacak,
          borc_sistem: datum.borc_sistem,
          alacak_sistem: datum.alacak_sistem,
          alacak_doviz: datum.alacak_doviz,
          borc_islem_doviz: datum.borc_islem_doviz,
          alacak_islem_doviz: datum.alacak_islem_doviz,
          birim_adi: datum.birim_adi,
          bakiye_sekli: datum.bakiye_sekli,
          aktif: datum.aktif,
          dovizkod: datum.dovizkod,
        },
      };

      const existingData = await Data.findOneAndUpdate(filter, updateData, { new: true });

      if (!existingData ) {
        await Data.create(newData)
      
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function getToken() {
  const apiUrl =
    "https://efatura.etrsoft.com/fmi/data/v1/databases/testdb/sessions";
  let token = "";
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa("apitest:test123"),
      },

      agent: httpsAgent,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    token = data.response.token;
  } catch (error) {
    console.error("Error:", error.message);
  }

  return token;
}






setInterval(getApiData, 10000);
@Injectable()
export class AppService {
  async getAllData() {
    var answer: any[] = [];
    var wait: any[] = [];
    
    try {
        const things = await Data.find({});
        
        things.filter(v => v.borc !== null).forEach(thing => {
            const n = thing.hesap_kodu?.split(".");
            
            if (n) {
                let i = answer.findIndex(t => t.hesab_no == n[0]);
    
                if (i != -1) {
                    if (n.length == 2) {
                        answer[i].sub_group.push({
                            "hesab_no": thing.hesap_kodu,
                            "borc": thing.borc,
                            "sub_group": []
                        });
                        answer[i].borc += thing.borc;
                    }
                    if (n.length == 3) {
                        let j = answer[i].sub_group.findIndex(t => t.hesab_no == n[0] + "." + n[1]);
                        if (j !== -1) {
                            answer[i].sub_group[j].sub_group.push({
                                "hesab_no": thing.hesap_kodu,
                                "borc": thing.borc
                            });
                        } else {
                            wait.push(thing);
                        }
                    }
                } else if (n.length == 3) {
                    wait.push(thing);
                } else {
                    answer.push({
                        "hesab_no": n[0],
                        "borc": thing.borc,
                        "sub_group": [{
                            "hesab_no": thing.hesap_kodu,
                            "borc": thing.borc,
                            "sub_group": []
                        }]
                    });
                }
            }
        });
    
        wait.forEach(thing => {
            const n = thing.hesap_kodu?.split(".");
            if (n) {
                let i = answer.findIndex(t => t.hesab_no == n[0]);
                let j = answer[i].sub_group.findIndex(t => t.hesab_no == n[0] + "." + n[1]);
                if (j !== -1) {
                    answer[i].sub_group[j].sub_group.push({
                        "hesab_no": thing.hesap_kodu,
                        "borc": thing.borc
                    });
                }
            }
        });
    
        return answer;
    } catch (err) {
        console.log(err);
        return err;
    }
    
}
}
