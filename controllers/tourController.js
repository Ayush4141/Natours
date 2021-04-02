const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
//const AppError = require('./../utils/appError');
const factory = require('./handleFactory');


const multerStorage = multer.memoryStorage();

const multerFilter = (req, filter, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image . Please upload image', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  {name: 'imageCover' , maxCount: 1},
  { name: 'images' , maxCount: 3},
]);

exports.resizeTourImages= catchAsync( async (req , res , next) => {
//  console.log(req.files);
  if(!req.files.imageCover || !req.files.images) return next();

 // 1) Cover image

  req.body.imageCover = `tour-${req.params.id}-{Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  //2 Images
  req.body.images = [];

  await Promise.all(req.files.images.map(async (file, i) => {
    const filename = `tour-${req.params.id}-{Date.now()}-${i+1}.jpeg`;
    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
  }));

  next();
});

exports.aliasTopTours = (req, res, next) => {
  (req.query.limit = '5'),
    (req.query.sort = '-ratingsAverage, price'),
    (req.query.fields = 'name,price,ratingsAverage,summary,difficulty');
  next();
};

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// exports.checkId = (req , res , next , val) =>{
//     console.log(`Tour id is ${val}`);
//     if(req.params.id *1 > tours.length)
//     {
//         return res.status(404).json({
//             status: 'fail',
//             message: 'Invalid Id'
//         });
//     }
//     next();
// }

// exports.checkbody = (req , res , next) =>{
//   if(!req.body.name || !req.body.price)
//   {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price'
//     })
//   }
//   next();
// }

exports.getAllTours = factory.getAll(Tour);

// try{
//Filtering
//     const queryObj = {...req.query};
//     const excludedFields = ['page','sort','limit','fields'];
//     excludedFields.forEach(el=> delete queryObj[el]);
// //    console.log(req.query, queryObj);

//     //ADVANCED FILTERING
//     let queryStr = JSON.stringify(queryObj);
//     queryStr.replace(/\b(gte||gt||lt||lte)\b/g,  match =>`$${match}`);
//     console.log(JSON.parse(queryStr));

//     let query = Tour.find(JSON.parse(queryStr));

//3 Sorting
// if(req.query.sort)
// {
//   const sortBy = req.query.sort.split(',').join(' ');
//   query = query.sort(sortBy);
// }else{
//   query= query.sort('-createdAt');
// }

//Fielding Limiting
// if(req.query.fields)
// {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select('name duration price');
// }else{
//   query = query.select('-__v')
// }

//Pagination
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page-1) * limit;
// query= query.skip(skip).limit(limit)

// if(req.query.page){
//   const numTours = await Tour.countDocuments();
//   if(skip>= numTours) throw new Error('This page doest not exist');
// }

exports.getTour = factory.getOne(Tour, { path: 'reviews' })


// console.log(req.params);
// const id = req.params.id * 1;

// const tour = tours.find((el) => el.id === id);

// res.status(200).json({
//   status: 'success',
//   // results: tours.length,
//   data: {
//     tour,
//   },
// });
//};

exports.createTour = factory.createOne(Tour);

//  console.log(req.body);
// const newId = tours[tours.length - 1].id + 1;
// const newTour = Object.assign({ id: newId }, req.body);
// tours.push(newTour);
// fs.writeFile(
//   `${__dirname}/dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   (err) => {
// res.status(201).json({
//   status: 'success',
// data: {
//   tour: newTour,
// },
// });
//   }
// );
//  res.send('Done');
//};

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res) => {
//   try {
//     await Tour.findByIdAndDelete(req.params.id);
//     res.status(204).json({
//       status: 'success',
//       data: null,
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: 'err',
//     });
//   }
// });

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: '$difficulty',
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: { avgPrice: 1 },
      },
      // {
      //   $match: { _id: { $ne: 'Easy'}}
      // }
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'err',
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    const year = req.params.year * 1; //2021

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates',
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numToursStarts: { $sum: 1 },
          tours: { $push: 'name' },
        },
      },
      {
        $addFields: { $month: '$-id' },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: { numToursStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};


exports.getToursWithin =  catchAsync(async( req , res , next) => {
  const { distance , latlng , unit} = req.params;
  const [lat,lng] = latlng.split(',');

  const radius = unit==='mi' ? distance / 3963.2 : distance / 6378.1;

  if(!lat || lng){
    next( new AppError('Please provide latitude and longitude',404));
  }

  const tours = await Tour.find( { 
    startLocation: {$geoWithin: {$centerSphere: [[lng, lat] , radius ]}}
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync( async (req , res , next) =>{

  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit ==='mi' ? 0.000621371 : 0.001;

  if (!lat || lng) {
    next(new AppError('Please provide latitude and longitude', 404));
  }

  const distances = Tour.aggregate([
    {
      $geoNear: {
        near: {
          type : 'Point',
          coordinates: [lng*1 , lat*1]
        },
        distanceField: 'distance',
        distanceMultiplier: 0.001
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });


})