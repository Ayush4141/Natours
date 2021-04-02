const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-Limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes')

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname , 'views'))


// 1) Global MIDDLEWARES
//Security HTTPs headers
 app.use(
    helmet(
     //{
  //   contentSecurityPolicy: {
  //     directives: {
  //       defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
  //       baseUri: ["'self'"],
  //       fontSrc: ["'self'", 'https:', 'data:'],
  //       scriptSrc: [
  //         "'self'",
  //         'https:',
  //         'http:',
  //         'blob:',
  //         'https://*.mapbox.com',
  //         'https://js.stripe.com',
  //         'https://m.stripe.network',
  //         'https://*.cloudflare.com',
  //       ],
  //       frameSrc: ["'self'", 'https://js.stripe.com'],
  //       objectSrc: ["'none'"],
  //       styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
  //       workerSrc: [
  //         "'self'",
  //         'data:',
  //         'blob:',
  //         'https://*.tiles.mapbox.com',
  //         'https://api.mapbox.com',
  //         'https://events.mapbox.com',
  //         'https://m.stripe.network',
  //       ],
  //       childSrc: ["'self'", 'blob:'],
  //       imgSrc: ["'self'", 'data:', 'blob:'],
  //       formAction: ["'self'"],
  //       connectSrc: [
  //         "'self'",
  //         "'unsafe-inline'",
  //         'data:',
  //         'blob:',
  //         'https://*.stripe.com',
  //         'https://*.mapbox.com',
  //         'https://*.cloudflare.com/',
  //         'https://bundle.js:*',
  //         'ws://127.0.0.1:*/',
  //       ],
  //       upgradeInsecureRequests: [],
  //     },
  //   },
  // }
   )
 );

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//Limit request from same ip
const  limiter = rateLimit({
  max: 100,
  windowMs: 60*60*1000,
  message: 'Too many request from this IP try later in an hour'
});



app.use('/api', limiter);

//Body parser, reading data from body to req.body
app.use(express.json( {limit: '10kb'}));
app.use(express.urlencoded({ extended: true , limit: '10kb'}));
app.use(cookieParser());

//Data sanitization against noSQL query injection and against XSS
app.use(mongoSanitize());

//Data sanitization
app.use(xss());

//Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize' , 'difficulty'
  ]
}));

//Servig static files
app.use(express.static(`${__dirname}/public`));
//app.use(express.static(path.join(__dirname, 'public')));

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

// 3) ROUTES

app.use('/' , viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews' , reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
