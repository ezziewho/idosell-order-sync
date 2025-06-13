const basicAuth = (req, res, next) => {
  //czemu nie jest async?
  const authHeader = req.headers.authorization; //z zapytania pobieramy nagłówek autoryzacji

  if (!authHeader) {
    //jeśli nie ma nagłówka autoryzacji, tylko jest jakiś inny nagłówek,
    // odsyłanywanie błędu 401 wraz z wiadomością
    return res.status(401).json({ message: "Authorization header is missing" });
  }

  const [type, credentials] = authHeader.split(" "); //tworzymy tablicę z tego co znajdujemy w nagłówku autoryzacji
  //zakładamy że są tam tylo dwa elementy: typ autoryzacji i dane uwierzytelniające. c się stanie jeśli
  //będzie więcej elementów? nie wiem, ale zakładam że nie będzie, bo to jest nagłówek autoryzacji

  if (type !== "Basic" || !credentials) {
    // sprawdzamy czy typ autoryzacji to Basic i czy są dane uwierzytelniające
    return res.status(401).json({ message: "Invalid authorization format" });
  }

  const [username, password] = Buffer.from(credentials, "base64") //dekodujemy dane uwierzytelniające z formatu base64
    //okej, tutaj nie rozumiem co sie dzieje
    .toString()
    .split(":");

  if (
    username !== process.env.BASIC_AUTH_USERNAME ||
    password !== process.env.BASIC_AUTH_PASSWORD
  ) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  next();
};

export default basicAuth;
