import { type TestInput, type TestOutput } from "./types";

function h(unsafe: string): string {
  if (unsafe == null) {
    return "";
  }

  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function runTest(input: TestInput): TestOutput {
  if (input.regex == null || input.regex.length == 0) {
    return { success: false, message: "No regex to test!" };
  }

  const options = input.option ? input.option.join("") : undefined;

  const html = [];
  html.push(
    '<table class="table table-bordered table-striped" style="width:auto;">\n'
  );

  html.push("\t<tr>\n");
  html.push("\t\t<td>Regular Expression</td>\n");
  html.push("\t\t<td>");
  html.push(h(input.regex));
  html.push("</td>\n");
  html.push("\t</tr>\n");

  html.push("\t<tr>\n");
  html.push("\t\t<td>Replacement</td>\n");
  html.push("\t\t<td>");
  html.push(h(input.replacement));
  html.push("</td>\n");

  html.push("\t<tr>\n");
  html.push("\t\t<td>Options</td>\n");
  html.push("\t\t<td>");
  html.push(options ? h(options) : "<i>(none)</i>");
  html.push("</td>\n");
  html.push("\t</tr>\n");
  html.push("</table>\n");

  let compileTest: RegExp;

  try {
    compileTest = new RegExp(input.regex, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : `unknown error ${err}`;
    return {
      success: false,
      message: `unable to create RegExp object: ${message}`,
      html: html.join(""),
    };
  }

  try {
    html.push('<table class="table table-bordered table-striped">\n');

    html.push("\t<thead>");
    html.push("\t\t<tr>\n");
    html.push('\t\t\t<th style="text-align:center;">Test</th>\n');
    html.push("\t\t\t<th>Input</th>");
    html.push("\t\t\t<th>regex.test()</th>");
    html.push("\t\t\t<th>input.replace()</th>");
    html.push("\t\t\t<th>input.replaceAll()</th>");
    html.push("\t\t\t<th>input.split()[]</th>");
    html.push("\t\t\t<th>regex.exec().index</th>");
    html.push("\t\t\t<th>regex.exec()[]</th>");
    html.push("\t\t\t<th>regex.lastIndex</th>");
    html.push("\t\t</tr>\n");
    html.push("\t</thead>\n");
    html.push("\t<tbody>\n");

    var count = 0;

    if (input.inputs != null) {
      for (var loop = 0; loop < input.inputs.length; loop++) {
        var target = input.inputs[loop];

        if (target.length == 0) {
          continue;
        }
        html.push("\t\t<tr>\n");

        html.push('\t\t\t<td style="text-align:center;">');
        html.push(loop + 1);
        html.push("</td>\n");

        html.push("\t\t\t<td>");
        html.push(h(target));
        html.push("</td>\n");

        html.push("\t\t\t<td>");
        html.push(
          new RegExp(input.regex, options).test(target) ? "true" : "false"
        );
        html.push("</td>\n");

        html.push("\t\t\t<td>");
        html.push(
          h(target.replace(new RegExp(input.regex, options), input.replacement))
        );
        html.push("</td>\n");

        html.push("\t\t\t<td>");
        try {
          html.push(
            h(
              target.replaceAll(
                new RegExp(input.regex, options),
                input.replacement
              )
            )
          );
        } catch (replaceAllErr) {
          const message =
            replaceAllErr instanceof Error
              ? replaceAllErr.message
              : `unknown error ${replaceAllErr}`;
          html.push(`<i>${message}</i>`);
        }
        html.push("</td>\n");

        html.push("\t\t\t<td>");
        var splits = target.split(new RegExp(input.regex, options));
        for (var split = 0; split < splits.length; split++) {
          html.push("[");
          html.push(split);
          html.push("]: ");
          html.push(splits[split] == null ? "<i>(null)</i>" : h(splits[split]));
          html.push("<br/>");
        }
        html.push("</td>\n");

        var regex = new RegExp(input.regex, options);
        var result = regex.exec(target);
        if (result == null) {
          html.push('\t\t\t<td colspan="6"><i>(null)</i></td>\n');
        } else {
          var first = true;

          while (result != null) {
            if (first == true) {
              first = false;
            } else {
              html.push("</tr>\n");
              html.push('\t\t\t<td colspan="6" style="text-align:right;">');
              html.push("regex.exec()");
              html.push("</td>\n");
            }

            html.push("\t\t\t<td>");
            html.push(result.index);
            html.push("</td>\n");

            html.push("\t\t\t<td>");
            for (var capture = 0; capture < result.length; capture++) {
              html.push("[");
              html.push(capture);
              html.push("]: ");
              html.push(
                result[capture] == null ? "<i>(null)</i>" : h(result[capture])
              );
              html.push("<br/>");
            }
            html.push("</td>\n");

            html.push("\t\t\t<td>");
            html.push(regex.lastIndex);
            html.push("</td>\n");

            result = global ? regex.exec(target) : null;
          }
        }
        html.push("\t\t</tr>\n");
        count++;
      }
    }

    if (count == 0) {
      html.push("\t\t<tr>\n");
      html.push('\t\t<td colspan="8"><i>');
      html.push("(no input to test)");
      html.push("</i></td>\n");
      html.push("\t\t</tr>\n");
    }

    html.push("\t</tbody>\n");
    html.push("</table>\n");
  } catch (err) {
    const message = err instanceof Error ? err.message : `unknown error ${err}`;
    return {
      success: false,
      message: `unable to run tests: ${message}`,
      html: html.join(""),
    };
  }

  return {
    success: true,
    html: html.join(""),
  };
}
