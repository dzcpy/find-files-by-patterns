import { assert } from "chai";
import chai = require("chai");
import chaiAsPromised = require("chai-as-promised");

import * as mock from "mock-fs";
import { resolve } from "path";

import { findFile, Matcher, ofBasename } from "../src";

chai.use(chaiAsPromised);

describe("findFile", () => {
  beforeEach(() => {
    mock(
      {
        "/home/user": {
          files: {
            "file.md": "",
            "file.html": "",
          },
          "symbolic-files": {
            "file.json": "",
            "file.html": mock.symlink({
              path: "/home/user/files/file.html",
            }),
          },
          "symbolic-folder": mock.symlink({
            path: "/home/user/files",
          }),
        },
        [process.cwd()]: {
          "file.html": mock.symlink({
            path: "/home/user/files/file.html",
          }),
          files: mock.symlink({
            path: "/home/user/files",
          }),
        },
      },
      {
        createCwd: false,
        createTmp: false,
      },
    );
  });
  afterEach(() => {
    mock.restore();
  });
  describe("Asynchronous", () => {
    describe("(...tests: Matcher[]): Promise<string | null>", () => {
      it("should arbitrarily resolve to `null` if no arguments are provided", () => {
        return assert.eventually.isNull(findFile());
      });
      it("should arbitrarily resolve to `null` if only an empty set of tests is provided", () => {
        const tests: Matcher[] = [];
        return assert.eventually.isNull(findFile(...tests));
      });
      it("should resolve an undefined directory path to the current working directory", () => {
        return assert.eventually.strictEqual(
          findFile(ofBasename("file.html")),
          resolve("./file.html"),
        );
      });
      it("should resolve to a found directory's path", () => {
        return assert.eventually.strictEqual(
          findFile(ofBasename("files")),
          resolve("./files"),
        );
      });
      it("should resolve to a found file's path", () => {
        return assert.eventually.strictEqual(
          findFile(ofBasename("file.html")),
          resolve("./file.html"),
        );
      });
      it("should not resolve to a path that doesn't pass all the tests", () => {
        return assert.eventually.isNull(
          findFile(ofBasename("file.html"), ofBasename("files")),
        );
      });
      it("should resolve to a path that passes all the tests", () => {
        return assert.eventually.isNotNull(
          findFile(ofBasename(/^file/), ofBasename(/\.html$/)),
        );
      });
      it("should be rejected if one of the tests throws an error", () => {
        return assert.isRejected(
          findFile(
            (path: string): boolean => {
              throw new Error();
            },
          ),
        );
      });
    });
    describe("(directories: string | Iterable<string>, ...tests: Matcher[]): Promise<string | null>", () => {
      it("should arbitrarily resolve to `null` if no arguments are provided", () => {
        return assert.eventually.isNull(findFile());
      });
      it("should arbitrarily resolve to `null` if only an empty set of directories is provided", () => {
        return assert.eventually.isNull(findFile([]));
      });
      it("should arbitrarily resolve to `null` if an empty set of directories is provided", () => {
        return assert.eventually.isNull(findFile([], ofBasename()));
      });
      it("should arbitrarily resolve to `null` if empty sets of directories and tests are provided", () => {
        return assert.eventually.isNull(findFile([], ...[]));
      });
      it("should arbitrarily resolve to `null` if no tests are provided", () => {
        return assert.eventually.isNull(findFile("./"));
      });
      it("should handle a directory specified with a string path", () => {
        return assert.eventually.strictEqual(
          findFile("./", ofBasename("file.html")),
          resolve("./file.html"),
        );
      });
      it("should handle directories specified with string paths", () => {
        return assert.eventually.strictEqual(
          findFile(["./", "./files"], ofBasename("file.html")),
          resolve("./file.html"),
        );
      });
      it("should resolve directory paths which are not absolute relative to the current working directory", () => {
        return Promise.all([
          assert.eventually.strictEqual(
            findFile("./", ofBasename("file.html")),
            resolve("./file.html"),
          ),
          assert.eventually.strictEqual(
            findFile("./files", ofBasename("file.html")),
            resolve("./files/file.html"),
          ),
        ]);
      });
      it("should resolve to null if there is no matching file in a directory", () => {
        return assert.eventually.isNull(
          findFile("/home/user/files", ofBasename("inexistant.json")),
        );
      });
      it("should resolve to null if there is no matching file in directories", () => {
        return assert.eventually.isNull(
          findFile(
            ["/home/user/files", "/home/user/symbolic-files"],
            ofBasename("inexistant.json"),
          ),
        );
      });
      it("should resolve to a found directory's path", () => {
        return assert.eventually.strictEqual(
          findFile("./", ofBasename("files")),
          resolve("./files"),
        );
      });
      it("should resolve to a found file's path", () => {
        return assert.eventually.strictEqual(
          findFile("./", ofBasename("file.html")),
          resolve("./file.html"),
        );
      });
      it("should resolve to a file's path if there is only one matching file in a directory", () => {
        return assert.eventually.strictEqual(
          findFile("/home/user/files", ofBasename("file.html")),
          resolve("/home/user/files/file.html"),
        );
      });
      it("should resolve to a file's path if there is only one matching file in a directory among the directories", () => {
        return assert.eventually.strictEqual(
          findFile(
            ["/home/user/files", "/home/user/symbolic-files"],
            ofBasename("file.html"),
          ),
          resolve("/home/user/files/file.html"),
        );
      });
      it("should be rejected if any of the given directories does not exist", () => {
        return assert.isRejected(
          findFile("./unexistant-folder", ofBasename("unexistant.html")),
        );
      });
      it("should be rejected if one of the tests throws an error", () => {
        return assert.isRejected(
          findFile(
            "./",
            (path: string): boolean => {
              throw new Error();
            },
          ),
        );
      });
      it("should be rejected if one of the directories is a file", () => {
        return assert.isRejected(
          findFile(["./", "./file.html"], ofBasename("unexistant.html")),
        );
      });
      it("should not be rejected if there is more than one matching file in a directory", () => {
        return assert.eventually.isNotNull(
          findFile("/home/user/files", ofBasename(/^file\./)),
        );
      });
    });
  });
  describe("Synchronous", () => {
    describe("(...tests: Matcher[]): string | null", () => {
      it("should arbitrarily return `null` if no arguments are provided", () => {
        assert.isNull(findFile.sync());
      });
      it("should arbitrarily return `null` if only an empty set of tests is provided", () => {
        const tests: Matcher[] = [];
        assert.isNull(findFile.sync(...tests));
      });
      it("should resolve an undefined directory path to the current working directory", () => {
        assert.strictEqual(
          findFile.sync(ofBasename("file.html")),
          resolve("./file.html"),
        );
      });
      it("should return a found directory's path", () => {
        assert.strictEqual(
          findFile.sync(ofBasename("files")),
          resolve("./files"),
        );
      });
      it("should return a found file's path", () => {
        assert.strictEqual(
          findFile.sync(ofBasename("file.html")),
          resolve("./file.html"),
        );
      });
      it("should not return a path that doesn't pass all the tests", () => {
        assert.isNull(
          findFile.sync(ofBasename("file.html"), ofBasename("files")),
        );
      });
      it("should return a path that passes all the tests", () => {
        assert.isNotNull(
          findFile.sync(ofBasename(/^file/), ofBasename(/\.html$/)),
        );
      });
      it("should throw an error if one of the tests throws an error", () => {
        assert.throws(() =>
          findFile.sync(
            (path: string): boolean => {
              throw new Error();
            },
          ),
        );
      });
    });
    describe("(directories: string | Iterable<string>, ...tests: Matcher[]): string | null", () => {
      it("should arbitrarily return `null` if no arguments are provided", () => {
        assert.isNull(findFile.sync());
      });
      it("should arbitrarily return `null` if only an empty set of directories is provided", () => {
        assert.isNull(findFile.sync([]));
      });
      it("should arbitrarily return `null` if an empty set of directories is provided", () => {
        assert.isNull(findFile.sync([], ofBasename()));
      });
      it("should arbitrarily return `null` if empty sets of directories and tests are provided", () => {
        assert.isNull(findFile.sync([], ...[]));
      });
      it("should arbitrarily return `null` if there are no tests to perform on files' path", () => {
        assert.isNull(findFile.sync("./"));
      });
      it("should handle a directory specified with a string path", () => {
        assert.strictEqual(
          findFile.sync("./", ofBasename("file.html")),
          resolve("./file.html"),
        );
      });
      it("should handle directories specified with string paths", () => {
        assert.strictEqual(
          findFile.sync(["./", "./files"], ofBasename("file.html")),
          resolve("./file.html"),
        );
      });
      it("should resolve directory paths which are not absolute relative to the current working directory", () => {
        assert.strictEqual(
          findFile.sync("./", ofBasename("file.html")),
          resolve("./file.html"),
        );
        assert.strictEqual(
          findFile.sync("./files", ofBasename("file.html")),
          resolve("./files/file.html"),
        );
      });
      it("should return null if there is no matching file in a directory", () => {
        assert.isNull(
          findFile.sync("/home/user/files", ofBasename("inexistant.json")),
        );
      });
      it("should return null if there is no matching file in directories", () => {
        assert.isNull(
          findFile.sync(
            ["/home/user/files", "/home/user/symbolic-files"],
            ofBasename("inexistant.json"),
          ),
        );
      });
      it("should return a found directory's path", () => {
        assert.strictEqual(
          findFile.sync("./", ofBasename("files")),
          resolve("./files"),
        );
      });
      it("should return a found file's path", () => {
        assert.strictEqual(
          findFile.sync("./", ofBasename("file.html")),
          resolve("./file.html"),
        );
      });
      it("should return a file's path if there is only one matching file in a directory", () => {
        assert.strictEqual(
          findFile.sync("/home/user/files", ofBasename("file.html")),
          resolve("/home/user/files/file.html"),
        );
      });
      it("should return a file's path if there is only one matching file in a directory among the directories", () => {
        assert.strictEqual(
          findFile.sync(
            ["/home/user/files", "/home/user/symbolic-files"],
            ofBasename("file.html"),
          ),
          resolve("/home/user/files/file.html"),
        );
      });
      it("should throw an error if any of the given directories does not exist", () => {
        assert.throws(() => {
          findFile.sync("./unexistant-folder", ofBasename("unexistant.html"));
        });
      });
      it("should throw an error if one of the tests throws an error", () => {
        assert.throws(() =>
          findFile.sync(
            "./",
            (path: string): boolean => {
              throw new Error();
            },
          ),
        );
      });
      it("should not throw an error if there is more than one matching file in a directory", () => {
        assert.isNotNull(
          findFile.sync("/home/user/files", ofBasename(/^file\./)),
        );
      });
      it("should be rejected if one of the directories is a file", () => {
        assert.throws(() =>
          findFile.sync(["./", "./file.html"], ofBasename("unexistant.html")),
        );
      });
    });
  });
});