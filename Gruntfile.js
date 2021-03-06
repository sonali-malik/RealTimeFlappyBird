module.exports = function(grunt) {

  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        eqnull: true,
        browser: true,
        strict: true,
        undef: true,
        unused: true,
        bitwise: true,
        forin: true,
        freeze: true,
        latedef: true,
        noarg: true,
        nocomma: true,
        nonbsp: true,
        nonew: true,
        notypeof: true,
        singleGroups: true,
        jasmine: true,
        jquery: true,
        globals: {
          module: false, require: false, // for Gruntfile.js
          exports: false, // for protractor.conf.js
          inject: false, // testing angular
          angular: false,
          console: false,
          browser: false, element: false, by: false, // Protractor
        },
      },
      all: ['Gruntfile.js', 'karma.conf.js', 'protractor.conf.js', 'src/*.js', 'languages/*.js']
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        background: true,
        singleRun: false
      }
    },
    // Run karma and watch files using:
    // grunt karma:unit:start watch
    watch: {
      files: ['src/*.js'],
      tasks: ['jshint', 'karma:unit:run']
    },
    concat: {
      options: {
        separator: ';',
      },
      dist: {
        // Order is important! gameLogic.js must be first because it defines myApp angular module.
        src: ['src/index.js'],
        dest: 'dist/everything.js',
      },
    },
    uglify: {
      options: {
        sourceMap: true,
      },
      my_target: {
        files: {
          'dist/everything.min.js': ['dist/everything.js']
        }
      }
    },
    processhtml: {
      dist: {
        files: {
          'index.min.html': ['index.html'],
          'index.min.js': ['index.js']
        }
      }
    },
    manifest: {
      generate: {
        options: {
          basePath: '.',
          cache: [
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.8/angular.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/seedrandom/2.3.11/seedrandom.min.js',
            'fpsMeter.min.js',
            'dist/everything.min.js',
            'http://yoav-zibin.github.io/emulator/dist/realTimeServices.2.min.js ',
            'imgs/bird.png', 'imgs/font_small_0.png', 'imgs/font_small_1.png','imgs/font_small_2.png', 'imgs/font_small_3.png', 'imgs/font_small_4.png', 'imgs/font_small_5.png', 'imgs/font_small_6.png', 'imgs/font_small_7.png', 'imgs/font_small_8.png', 'imgs/font_small_9.png', 'imgs/medal_gold.png', 'imgs/medal_bronze.png', 'imgs/medal_silver.png', 'imgs/medal_platinum.png', 'imgs/replay.png', 'imgs/scoreboard.png', 'imgs/splash.png',
            'audio/die.ogg','audio/hit.ogg','audio/point.ogg','audio/swooshing.ogg','audio/wing.ogg',
            'http://yoav-zibin.github.io/emulator/main.css', 
            
            'style.css'
          ],
          network: ['dist/everything.min.js.map', 'dist/everything.js'],
          timestamp: true
        },
        dest: 'index.appcache',
        src: []
      }
    },
    'http-server': {
        'dev': {
            // the server root directory
            root: '.',
            port: 9000,
            host: "0.0.0.0",
            cache: 1,
            showDir : true,
            autoIndex: true,
            // server default file extension
            ext: "html",
            // run in parallel with other tasks
            runInBackground: true
        }
    },
    protractor: {
      options: {
        configFile: "protractor.conf.js", // Default config file
        keepAlive: true, // If false, the grunt process stops when the test fails.
        noColor: false, // If true, protractor will not use colors in its output.
        args: {
          // Arguments passed to the command
        }
      },
      all: {}
    },
  });

  require('load-grunt-tasks')(grunt);

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'karma',
      'concat', 'uglify',
      'processhtml', 'manifest',
      'http-server', 'protractor']);

};