#Software Expertise

## Have the system up and running:

### Linux:
1. Install git, mongodb (3.2.6), nodejs (6.2.2) and npm (3.9.6)
2. Run `npm install` to install project dependencies.
3. Make sure that mongodb is running.
4. Run `node_modules/gulp/bin/gulp.js` in the root directory of this project to run the server. (If you want to run the server with `gulp`, you have to install it globally `$ [sudo] npm install gulp -g`)
5. Go to [localhost](http://localhost:3000) and enjoy it!

#### Troubleshooting:

If `npm install` or `gulp` fails it probably means that some dependencies are not up to date. Try running `[sudo] npm update -g` to update npm and gulp or `npm update` to update the local dependencies.
