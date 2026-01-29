import axios from "axios";
import config from "../config.json";

async function getConfiguration() {
  // const key = localStorage.getItem("x-key");
  // const responce = await axios.get(`${config.apiUrl}/config`, {
  //   headers: {
  //     "x-key": key,
  //   },
  // });
  // if (responce.data.key) {
  //   localStorage.setItem("x-key", responce.data.key);
  // }
  // return responce.data;
  return null;
}

export default getConfiguration;
