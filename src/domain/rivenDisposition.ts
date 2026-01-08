import { ExportWeapons, dict_en, dict_zh } from "warframe-public-export-plus";
import { normalizeName, listToDict } from "../utils";
import rivenCalc from "../assets/rivencalc.json";

export const weaponRivenDispositionDict = (() => {
  const mapped = rivenCalc.weapons.reduce<
    {
      name: {
        en: string;
        zh: string;
      };
      calc: {
        disposition: number;
        name: string;
        texture: string;
        riventype: string;
      };
      weapon: any;
    }[]
  >((prev, element) => {
    let mapped = undefined;
    for (const weaponKey in ExportWeapons) {
      const weapon = ExportWeapons[weaponKey];

      const splited = weapon.name.split("/");
      if (splited.length <= 0) {
        continue;
      }

      const keyName = splited[splited.length - 1];
      const normalizedCalcName = normalizeName(element.name);
      if (normalizeName(keyName) === normalizedCalcName) {
        mapped = weapon;
        break;
      }

      const weaponEN = dict_en[weapon.name];
      if (weaponEN && normalizeName(weaponEN) === normalizedCalcName) {
        mapped = weapon;
        break;
      }
    }

    if (!mapped) {
      return prev;
    }

    const weaponEN = dict_en[mapped.name];
    const weaponZH = dict_zh[mapped.name];
    const result = {
      name: {
        en: weaponEN,
        zh: weaponZH,
      },
      calc: element,
      weapon: mapped,
    };

    prev.push(result);

    return prev;
  }, []);

  return listToDict(mapped, (e) => [
    normalizeName(e.name.zh),
    normalizeName(e.name.en),
  ]);
})();
