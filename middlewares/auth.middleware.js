import mongo from "../db/db.js";

export default async function tokenValidation(req, res, next) {

  const { authorization } = req.headers;

  const token = authorization?.replace('Bearer ', '');

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    let db = await mongo();

    const session = await db.collection('sessions').findOne({ token });

    if (!session) {
      return res.sendStatus(401);
    }

    res.locals.userId = session.userId;
    res.locals.token = session.token;
    next();
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};