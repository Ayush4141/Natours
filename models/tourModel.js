const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
    unique: true,
    trim: true,
    maxlength: [40, ' A tour name must have less than 40 characters' ],
    minlength: [10 , 'A tour name must be more than or equal to 10 characters'],
//    validate: validator.isAlpha,
//    validate: [validator.isAlpha, 'Must contain only characters']
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration  '],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'A tour must have a maxGroupsize'],
  },
  difficulty: {
    type: String,
    required: ['A tour must have difficulty'],
    enum: {
      values: ['easy','medium','difficult'],
      message: 'Difficulty must be either easy medium or difficult'
  }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1 , 'Rating must be above 1'],
    max: [5 , 'Ratings must be less than 5'],
    set : val => Math.round(val * 10 ) / 10
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price'],
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val){
        //this only points to current doc on NEW document creation
      return val<this.price;
    },
    message: 'Discount price ({VALUE})must be less than price'
  }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, ' Atour must have a summary'],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have a image'],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  secretTours: {
    type: Boolean,
    default: false
  },
  startLocation: {
    //GeoJSON
    type: {
      type: 'String',
      default: 'Point',
      enum : ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  guides: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ]

}, {
  toJSON: {virtuals: true},
  toObject: {virtuals: true}
});

// tourSchema.index( {price: 1});
tourSchema.index({ price: 1 , ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere'});

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration/ 7;
});

//Virtual Populate
tourSchema.virtual('reviews' , {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'

})

//DOCUMENT MIDDLEWARE runs before .save() and .create() command but not on insertMany
tourSchema.pre('save' , function(next){
  this.slug = slugify(this.name, {lower: true});
  next();
});

//For embedding
// tourSchema.pre('save', async function(next){
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// })

// tourSchema.pre('save', function(next){
//   console.log('Will save document');
//   next();
// })

// tourSchema.post('save', function(doc,next){
//   next();
// });

//Querying MiddleWare
tourSchema.pre(/^find/, function(next){
  this.find({ secretTour: {$ne: true}});
  this.start = Date.now();
  next();
})

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.post(/^find/ , function(docs, next){
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  console.log(docs);
  next();
})



//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate' , function(next){
//   this.pipeline().unshift( { $match: { secretTour: { $ne: true}}});
//   next();
// })
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
