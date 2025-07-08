declare module 'minimatch' {
  function minimatch(target: string, pattern: string, options?: minimatch.IOptions): boolean;

  namespace minimatch {
    interface IOptions {
      debug?: boolean;
      nobrace?: boolean;
      noglobstar?: boolean;
      dot?: boolean;
      noext?: boolean;
      nocase?: boolean;
      nonull?: boolean;
      matchBase?: boolean;
      nocomment?: boolean;
      nonegate?: boolean;
      flipNegate?: boolean;
    }

    function filter(pattern: string, options?: IOptions): (element: string) => boolean;
    function match(list: string[], pattern: string, options?: IOptions): string[];
    function makeRe(pattern: string, options?: IOptions): RegExp | false;
  }

  export = minimatch;
}
