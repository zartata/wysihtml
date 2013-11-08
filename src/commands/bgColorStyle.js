/**
 * document.execCommand("foreColor") will create either inline styles (firefox, chrome) or use font tags
 * which we don't want
 * Instead we set a css class
 */
(function(wysihtml5) {
  var REG_EXP = /(\s|^)background-color\s*:\s*[^;\s]+;?/gi;
  
  wysihtml5.commands.bgColorStyle = {
    exec: function(composer, command, color) {
      var colorVals  = wysihtml5.quirks.parseColorStyleStr((typeof(color) == "object") ? "background-color:" + color.color : "background-color:" + color, "background-color"),
          colString;
      
      if (colorVals) {
        colString = "background-color: rgb(" + colorVals[0] + ',' + colorVals[1] + ',' + colorVals[2] + ');';
        if (colorVals[3] !== 1) {
          colString += "background-color: rgba(" + colorVals[0] + ',' + colorVals[1] + ',' + colorVals[2] + ',' + colorVals[3] + ');';
        }
        wysihtml5.commands.formatInline.execWithToggle(composer, command, "span", false, false, colString, REG_EXP);
      }
    },
    
    state: function(composer, command) {
      return wysihtml5.commands.formatInline.state(composer, command, "span", false, false, "background-color", REG_EXP);
    },
    
    stateValue: function(composer, command) {
      var st = this.state(composer, command),
          colorStr;
          
      if (st && wysihtml5.lang.object(st).isArray()) {
        st = st[0];
      }
      
      if (st) {
        colorStr = st.getAttribute('style');
        if (colorStr) {
          if (colorStr) {
            return wysihtml5.quirks.parseColorStyleStr(colorStr, "background-color");
          }
        }
      }
      return false;
    }
    
  };
})(wysihtml5);