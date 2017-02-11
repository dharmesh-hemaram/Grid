String.prototype.removeHTMLTag = function() {
  return $("<div>").html(this).text();
};
String.prototype.escapeRegExp = function() {
  return this.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
};