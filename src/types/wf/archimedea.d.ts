interface ArchiMedea {
  name: string;
  missions: ArchiMedeaMission[];
  peronal: ArchiMedeaDebuff[];
}

interface ArchiMedeaMission {
  type: string;
  diviation: ArchiMedeaDebuff;
  risks: ArchiMedeaDebuff[];
}

interface ArchiMedeaDebuff {
  name: string;
  desc: string;
}
