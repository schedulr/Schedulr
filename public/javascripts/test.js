(function($) {
  function testDrilldown() {
    for(var c = 0; c < 6; c++) {
      console.log("Opening Top Row: "+c);
      $.drillDown.openRow(c,0);
      openSubPanel(1);
    }
  
    function openSubPanel(panel) {
      if($.drillDown.panels[panel] === undefined) return;
      
      var items = $.drillDown.panels[panel].items;
      var filteredItems = $.drillDown.panels[panel].filteredItems;
      var newPanel = panel+1;
      
      if(items !== undefined) {
        for(var c = 0; c < items.length; c++) {
          if(panel === 1) console.log('Open Sub Panel: '+c);
          $.drillDown.openRow(panel, c);
          openSubPanel(newPanel);
        }
      }
      
      if(filteredItems !== undefined) {
        for(var c = 0; c < filteredItems.length; c++) {
          if(panel === 1) console.log('Open Sub Filtered Panel: '+c);
          $.drillDown.openRow(panel, c);
          openSubPanel(newPanel);
        }
      }
    }
  }
  
  window.test = {
    testDrilldown: testDrilldown
  };
})(jQuery);