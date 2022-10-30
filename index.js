(() => {

  console.log('load');

  $.ajax({
    url: "./epysa-contacts.json",
    method: "GET",
    dataType: "jsonp",
    success: () => {
      console.log("test");
    },
    error: (e) => {
      console.error(e);
    },
    complete: () => {
      console.log("complete")
    }
  });

})();
