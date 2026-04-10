interface ArchiMedea {
  name: string;
  missions: ArchiMedeaMission[];
  peronal: ArchiMedeaDebuff[];
}

interface ArchiMedeaMission {
  type: string;
  deviation: ArchiMedeaDebuff;
  risks: ArchiMedeaDebuff[];
}

interface ArchiMedeaDebuff {
  name: string;
  desc: string;
}
