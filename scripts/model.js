"use strict" ;
function Constant(){
    // Grid Setting
    this.NX  = 380 ;
    this.NZ  = 128 ;
    this.DX  = 100 ;
    this.DZ  = 100 ; 
    this.DT  = 0.5   ;
    this.DTX = 2.0 * this.DT / this.DX ;
    this.DTZ = 2.0 * this.DT / this.DX ;
    // Thermal parameter 
    this.GRAVITY = 9.81 ;
    this.R_D = 287.0  ;
    this.C_P = 1003.5 ; 
    this.C_S = 50.0   ;
    this.C_V = this.C_P - this.R_D ;
    // Diffusion Term
    this.KX = 75 ;
    this.KZ = 75 ;
    // Pressure Init
    this.PZERO = 100000.0 ;
    this.PSURF = 96500.0  ;
    // Manage Time
    this.PERGRAPH = 40 ;
    this.EINISHTIME = 900.0 ;
    // Perturbation Parameter
    this.zcnt  = null ;
    this.delta = null ;
    this.radx  = null ;
    this.radz  = null ;
    this.imid  = null ;
    // Flag
    this.DIFFUSION = true ;
    this.NEUTRAL = true ;
    
}

function WholeGrid(){
    var con   = new Constant() ;
    
    // Time Maintain variable
    this.timePerGraph = 1  ;
    this.currentTime  = 0  ;
    this.timeEnd      = 50 ;
    // Base state arrays
    this.tb    = new Array(con.NZ) ;
    this.qb    = new Array(con.NZ) ;
    this.pb    = new Array(con.NZ) ;
    this.pib   = new Array(con.NZ) ;
    this.rhou  = new Array(con.NZ) ;
    this.rhow  = new Array(con.NZ) ;
    // progonstic arrays 
    this.thp   = new Array(con.NZ);
    this.th    = new Array(con.NZ);
    this.thm   = new Array(con.NZ);
    this.up    = new Array(con.NZ);
    this.u     = new Array(con.NZ);
    this.um    = new Array(con.NZ);
    this.wp    = new Array(con.NZ);
    this.w     = new Array(con.NZ);
    this.wm    = new Array(con.NZ);
    this.pip   = new Array(con.NZ);
    this.pi    = new Array(con.NZ);
    this.pim   = new Array(con.NZ);
    // User Change Parameter
    this.zcnt  = $('#init_zcnt').val() ;
    this.delta = $('#init_delta').val() ;
    this.radx  = $('#init_radx').val() ;
    this.radz  = $('#init_radz').val() ;
    this.imid  = $('#init_imid').val() ;
    // For Plot
    this.xgrid = new Array(con.NX);
    this.zgrid = new Array(con.NZ);
    // Initailize
    for ( var k=0 ; k < con.NZ ; k++){
        this.tb[k]    = 0 ;
        this.qb[k]    = 0 ;
        this.pb[k]    = 0 ;
        this.pib[k]   = 0 ;
        this.rhou[k]  = 0 ;
        this.rhow[k]  = 0 ;
        this.thp[k]   = new Array(con.NX);
        this.th[k]    = new Array(con.NX);
        this.thm[k]   = new Array(con.NX);
        this.up[k]    = new Array(con.NX);
        this.u[k]     = new Array(con.NX);
        this.um[k]    = new Array(con.NX);
        this.wp[k]    = new Array(con.NX);
        this.w[k]     = new Array(con.NX);
        this.wm[k]    = new Array(con.NX);
        this.pip[k]   = new Array(con.NX);
        this.pi[k]    = new Array(con.NX);
        this.pim[k]   = new Array(con.NX);
        for ( var i=0 ; i < con.NX ; i++){
            this.thp[k][i]    = 0;
            this.th[k][i]     = 0;
            this.thm[k][i]    = 0;
            this.up[k][i]     = 0;
            this.u[k][i]      = 0;
            this.um[k][i]     = 0;
            this.wp[k][i]     = 0;
            this.w[k][i]      = 0;
            this.wm[k][i]     = 0;
            this.pip[k][i]    = 0;
            this.pi[k][i]     = 0;
            this.pim[k][i]    = 0;
        }
    }
    
    this.zgrid[0] = 0 ;
    for ( var k=1 ; k < con.NZ ; k++){    
        this.zgrid[k] = this.zgrid[k-1] + con.DZ ;
    }
    
    this.xgrid[0] = - (con.DX * con.NX / 2);
    for ( var i=1 ; i < con.NX ; i++){
        this.xgrid[i] =  this.xgrid[i-1] + con.DX ;
    }
}

WholeGrid.prototype.baseState_OneDimension_Initialization = function(){
    var tbv_previous = 0 ;
    var tbv_current  = 0 ;
    var tbvavg       = 0 ;
    var con          = new Constant() ;
    var x_k          = con.R_D / con.C_P ;
    
    this.pb[1]  = con.PSURF ;
    this.tb[1]  = con.NEUTRAL ? 300.0 : this.base_ThetaBar_Distribution(1) ;
    this.qb[1]  = con.NEUTRAL ? 0.0   : this.base_QvBar_Distribution(1)    ;
    
    tbv_previous  = this.tb[1] * (1 + 0.61 * this.qb[1] );
    
    this.pib[1]  = Math.pow( this.pb[1] / con.PZERO , x_k ) 
                   - con.GRAVITY * 0.5 * con.DZ / ( con.C_P * tbv_previous );    
    this.rhou[1] = con.PZERO * Math.pow( this.pib[1] , con.C_V / con.R_D ) / ( con.R_D * tbv_previous );
    this.rhow[1] = this.rhou[1];

    for ( var k=2 ; k <= con.NZ - 2 ; k++ ){
        this.tb[k]  = con.NEUTRAL ? 300.0 : this.base_ThetaBar_Distribution(k) ;
        this.qb[k]  = con.NEUTRAL ? 0.0   : this.base_QvBar_Distribution(k)  ;        
        tbv_current = this.tb[k] * ( 1 + 0.61 * this.qb[k] );
        tbvavg = 0.5 * ( tbv_current + tbv_previous ) ;
        
        this.pib[k]  = this.pib[k-1] - con.GRAVITY * con.DZ / ( con.C_P * tbvavg ) ;
        this.pb[k]   = con.PZERO * Math.pow( this.pib[k], con.C_P / con.R_D );
        this.rhou[k] = con.PZERO * Math.pow( this.pib[k], con.C_V / con.R_D ) / ( con.R_D * tbvavg );
        this.rhow[k] = 0.5 * ( this.rhou[k] + this.rhou[k-1] );
        
        tbv_previous = tbv_current;        
    }
    this.tb[0]          = this.tb[1];
    this.tb[con.NZ-1]   = this.tb[con.NZ-2];
    this.pib[0]         = this.pib[1];
    this.pib[con.NZ-1]  = this.pib[con.NZ-2];
    this.rhou[0]        = this.rhou[1];
    this.rhou[con.NZ-1] = this.rhou[con.NZ-2];
    this.rhow[0]        = this.rhow[1];
    this.rhow[con.NZ-1] = this.rhow[con.NZ-2];
    this.qb[0]          = this.qb[1];
    this.qb[con.NZ-1]   = this.qb[con.NZ-2];        
};

WholeGrid.prototype.perturbation_Initialization_Cold = function(){
    var con    =  new Constant() ;
    var TRIGPI =  4. * Math.atan( 1.0 );
    this.imid   =  this.imid  || (( con.NX % 2 == 0 ) ? con.NX/2 : (con.NX-1.0)/2) ;
    this.zcnt   =  this.zcnt  || 3000   ;
    this.delta  =  this.delta || -15.0  ;
    this.radx   =  this.radx  || 4000.0 ;
    this.radz   =  this.radz  || 2000.0 ;

    var currentRad = 0 ;
    var tup = 0 ; 
    var tdn = 0 ;
    var z_scalar = 0 ;
    
    /* Create Theta perturbation */
    for (var k=1;k<=con.NZ-2;k++){
        for (var i=1;i<=con.NX-2;i++){    
            z_scalar = con.DZ * (k - 0.5);
            currentRad = Math.sqrt( Math.pow( ( z_scalar - this.zcnt ) / this.radz , 2 ) + Math.pow( con.DX *( i - this.imid )/this.radx , 2 ) ) ;
            this.th[k][i] = ( currentRad >= 1 ) ? 0.0 : 0.5 * this.delta * ( Math.cos( TRIGPI * currentRad ) + 1 );
            /* make sure the first step run correctly */
            this.thm[k][i] = this.th[k][i];
        }
    }
    /* Modify Pressure Adjustment to Initial Temperature Perturbation  */
    for (var i=1; i<=con.NX-2 ; i++){
        this.pi[con.NZ-1][i] = 0;
        for (var k=con.NZ-2 ; k>=1 ; k--) {    
            tup = this.th[k+1][i] / ( this.tb[k+1] * this.tb[k+1] );
            tdn = this.th[k][i]   / ( this.tb[k]   * this.tb[k]   );
            this.pi[k][i] = this.pi[k+1][i] - 0.5 * ( con.GRAVITY / con.C_P ) * ( tup + tdn ) * con.DZ;
            /* make sure the first step run correctly */
            this.pim[k][i] = this.pi[k][i];
        }
        this.pi[0][i]  = this.pi[1][i];
        this.pim[0][i] = this.pim[1][i];            
    }

};

WholeGrid.prototype.perturbation_Initialization = function(){
    var con    = new Constant() ;
    var TRIGPI = 4. * Math.atan(1.0);
    var imid   =  ( con.NX % 2 == 0) ? con.NX / 2 : ( con.NX - 1.0 ) / 2 ;
    var zcnt   =  3000 ;
    var delta  =  5.0;
    var radx   =  4000.0 , radz = 4000.0;

    var currentRad;
    var tup;
    var tdn;
    var z_scalar;

    /* Create Theta perturbation */
    for (var i=1;i<=con.NX-2;i++){
        for (var k=1;k<=con.NZ-2;k++){
            z_scalar = con.DZ * (k - 0.5);
            currentRad = Math.sqrt( Math.pow( ( z_scalar - zcnt)/radz , 2 ) + Math.pow( con.DX * ( i - imid )/radx , 2 ) ) ;

            if ( currentRad >= 1 ){
                this.th[k][i] = 0;
            }else{
                this.th[k][i] = 0.5 * delta * ( Math.cos( TRIGPI * currentRad ) + 1 );
            }
            /* make sure the first step run correctly */
            this.thm[k][i] = this.th[k][i];
        }
    }
    
    /* Modify Pressure Adjustment to Initial Temperature Perturbation  */

    for (var i=1; i<=con.NX-2;i++){
        this.pi[NZ-1][i] = 0;    
        for (var k=con.NZ-2;k>=1;k--) {
            tup = this.th[i][k+1]/( this.tb[k+1] * this.tb[k+1] );
            tdn = this.th[i][k] / ( this.tb[k]   * this.tb[k]) ;
            this.pi[k][i] = this.pi[k+1][i] - 0.5 * ( con.GRAVITY / con.C_P ) * ( tup + tdn ) * con.DZ;
            /* make sure the first step run correctly */
            this.pim[k][i] = this.pi[k][i] ;
        }
        this.pi[0][i]  = this.pi[1][i] ;
        this.pim[0][i] = this.pim[1][i];
    }

};


/* Private Function */
WholeGrid.prototype.base_ThetaBar_Distribution = function(z_grid_index){
    var con      = new Constant() ;
    var z_TR     = 12000;        //[m] Height level of Tropopause
    var T_TR     = 213;          //[K] Temperature of Tropopause
    var Theta_TR = 343;          //[K] Potential Temperature of Tropopause
    var z_T      = ( z_grid_index - 0.5 ) * DZ ;    
    
    if( z_T <= z_TR){
        return ( 300 + 43 * Math.pow( z_T / z_TR , 1.25 ) ) ;
    }else{
        return ( Theta_TR * Math.exp( con.GRAVITY * ( z_T - z_TR ) / ( con.C_P * T_TR ) ) ) ;
    }

};


WholeGrid.prototype.base_QvBar_Distribution = function(z_grid_index){
    var con = new Constant();
    var z_T = ( (z_grid_index - 0.5) )* con.DZ ;
    
    
    if( z_T <= 4000 ){
        return 0.0161 - 0.000003375 * z_T ; 
    }else if ( z_T <= 8000 ){
        return 0.0026 - 0.00000065 * ( z_T - 4000 ) ;
    }else{
        return 0;
    }
}


WholeGrid.prototype.compute_du_dt = function(){
    var con = new Constant() ;
    
    /* Main function calculate du_dt */
    for (var k=1;k<con.NZ-1;k++){
        for (var i=1;i<con.NX-1;i++){
            this.up[k][i] = this.um[k][i]
                - 0.25 * con.DTX *( 
                       ( this.u[k][i+1] + this.u[k][i])*( this.u[k][i+1] + this.u[k][i]) 
                      -( this.u[k][i-1] + this.u[k][i])*( this.u[k][i-1] + this.u[k][i]) 
                )
                - 0.25 * con.DTZ *( 
                        this.rhow[k+1] *( this.w[k+1][i] + this.w[k+1][i-1] )
                                       *( this.u[k+1][i] + this.u[k  ][i  ] )
                       -this.rhow[k  ] *( this.w[k  ][i] + this.w[k  ][i-1] )
                                       *( this.u[k-1][i] + this.u[k  ][i  ] )
                ) / this.rhou[k] 
                - con.DTX * con.C_P  
                       *this.tb[k] * ( this.pi[k][i] - this.pi[k][i-1] ) ;
            if ( con.DIFFUSION ){
                this.up[k][i] +=
                    +con.DTX * con.KX/con.DX * (  this.um[k][i+1] - 2. * this.um[k][i] + this.um[k][i-1] )             
                    +con.DTZ * con.KZ/con.DZ * (  this.um[k+1][i] - 2. * this.um[k][i] + this.um[k-1][i] ) ;    /* Diffusion Term */                        ;                    
            }    
        }
    }
    /* zero gradient for top and bottom */
    for (var i=1;i<con.NX-1;i++){
        this.up[0][i]       = this.up[1][i] ;
        this.up[con.NZ-1][i]= this.up[con.NZ-2][i] ;
    }
    /* Periodic for left and right */
    for (var k=1;k<con.NZ-1;k++){
        this.up[k][0]        = grid.up[k][con.NX-2];
        this.up[k][con.NX-1] = grid.up[k][1];
    }
    
};

WholeGrid.prototype.compute_dw_dt =function(){
    var con = new Constant() ;
    
    for (var k=2;k<con.NZ-1;k++ ){
        for (var i=1;i<con.NX-1;i++ ){
            this.wp[k][i] =
               -con.DTX * (
                    0.25 * ( this.u[k][i+1] + this.u[k-1][i+1]) * ( this.w[k][i+1] + this.w[k][i  ] ) 
                   -0.25 * ( this.u[k][i  ] + this.u[k-1][i  ]) * ( this.w[k][i  ] + this.w[k][i-1] )
                )
               -con.DTZ * (
                    0.25 * this.rhou[k  ]* ( this.w[k+1][i] + this.w[k  ][i] ) * ( this.w[k+1][i] + this.w[k  ][i] )
                   -0.25 * this.rhou[k-1]* ( this.w[k  ][i] + this.w[k-1][i] ) * ( this.w[k  ][i] + this.w[k-1][i] )
                ) / this.rhow[k]
               -con.C_P * con.DT * ( this.tb[k] + this.tb[k-1] ) * ( this.pi[k][i] - this.pi[k-1][i] ) / con.DZ 
               +con.GRAVITY * con.DT * ( ( this.th[k][i] / this.tb[k] ) + ( this.th[k-1][i] / this.tb[k-1] ) ) 
               +this.wm[k][i] ;
               
            if ( con.DIFFUSION ){
                this.wp[k][i] +=
                        con.DTX * con.KX / con.DX * (  this.wm[k][i+1]- 2. * this.wm[k][i] + this.wm[k][i-1] )             
                       +con.DTZ * con.KZ / con.DZ * (  this.wm[k+1][i]- 2. * this.wm[k][i] + this.wm[k-1][i] ) ;    /* Diffusion Term */
            }
        }
    }
    
    /* zero gradient for top and bottom */
    for (var i=1;i<con.NX;i++){
        this.wp[0][i]        = 0. ;
        this.wp[1][i]        = 0. ;
        this.wp[con.NZ-1][i] = 0. ;
    }
    /* Periodic for left and right */
    for (var k=1;k<con.NZ-1;k++){
        this.wp[k][0]        = this.wp[k][con.NX-2];
        this.wp[k][con.NX-1] = this.wp[k][1]   ;
    }

};

WholeGrid.prototype.compute_dtheta_dt = function(){
    var con = new Constant() ;

    for (var k=1;k<con.NZ-1;k++){
        for (var i=1;i<con.NX-1;i++){
            this.thp[k][i]  =
               -con.DTX *( 
                    0.5 * this.u[k][i+1] * ( this.th[k][i+1] + this.th[k][i  ] ) 
                   -0.5 * this.u[k][i  ] * ( this.th[k][i  ] + this.th[k][i-1] ) 
                )
               -con.DTZ / (this.rhou[k]) * ( 
                    0.5 * this.rhow[k+1] * this.w[k+1][i] * ( this.th[k+1][i] + this.th[k  ][i] ) 
                   -0.5 * this.rhow[k  ] * this.w[k  ][i] * ( this.th[k  ][i] + this.th[k-1][i] ) 
                )
               -con.DT / (this.rhou[k]) * (
                    this.rhow[k+1] * this.w[k+1][i] * ( this.tb[k+1] - this.tb[k  ] ) / con.DZ  
                   +this.rhow[k  ] * this.w[k  ][i] * ( this.tb[k  ] - this.tb[k-1] ) / con.DZ
                )
               +this.thm[k][i] ;
            if ( con.DIFFUSION ){
                this.thp[k][i]  +=
                      con.DTX * con.KX/con.DX * (  this.thm[k][i+1] - 2. * this.thm[k][i]  + this.thm[k][i-1] )             
                    + con.DTZ * con.KZ/con.DZ * (  this.thm[k+1][i] - 2. * this.thm[k][i]  + this.thm[k-1][i] ) ;   /* Diffusion Term */                                                            
            }                         
        }
    }  
    /* zero gradient for top and bottom */
    for (var i=1;i<con.NX-1;i++){
        this.thp[0][i]       = this.thp[1][i] ;
        this.thp[con.NZ-1][i]= this.thp[con.NZ-2][i] ;
    }
    /* Periodic for left and right */
    for (var k=1;k<con.NZ-1;k++){
        this.thp[k][0]        = this.thp[k][con.NX-2];
        this.thp[k][con.NX-1] = this.thp[k][1];
    }

};


WholeGrid.prototype.compute_dpi_dt = function(){
    var con = new Constant() ;
    var c_s2 = con.C_S * con.C_S ; // sound speed (adiabatic)
    
    for (var k=1;k<con.NZ-1;k++){
        for (var i=1;i<con.NX-1;i++){    
            this.pip[k][i]=
               -( c_s2 / ( this.rhou[k] * con.C_P * this.tb[k] * this.tb[k] ) ) * ( 2.* con.DT ) 
               *(   1./con.DX * this.rhou[k] * this.tb[k] * ( this.u[k][i+1] - this.u[k][i] ) 
                   +1./con.DZ * ( 
                        0.5 * this.rhow[k+1] * this.w[k+1][i] * ( this.tb[k+1] + this.tb[k  ] ) 
                       -0.5 * this.rhow[k  ] * this.w[k  ][i] * ( this.tb[k  ] + this.tb[k-1] ) 
                    ) 
                )
               +this.pim[k][i] ;
            if ( con.DIFFUSION ){
                this.pip[k][i] +=
                    con.DTX * con.KX/con.DX * (  this.pim[k][i+1]- 2.*this.pim[k][i] + this.pim[k][i-1] )             
                   +con.DTZ * con.KZ/con.DZ * (  this.pim[k+1][i]- 2.*this.pim[k][i] + this.pim[k-1][i] ) ;   /* Diffusion Term */                  
            }    
        }
    }
    /* zero gradient for top and bottom */
    for (var i=1;i<con.NX-1;i++){
        this.pip[0][i]        = this.pip[1][i]    ;
        this.pip[con.NZ-1][i] = this.pip[con.NZ-2][i] ;
    }
    /* Periodic for left and right */
    for (var k=1;k<con.NZ-1;k++){
        this.pip[k][0]        = this.pip[k][con.NX-2];
        this.pip[k][con.NX-1] = this.pip[k][1];
    }

};




WholeGrid.prototype.compute_all = function(updatePlot){
    var con = new Constant() ;
    
    /* Show Time */
    //console.log('Current Time = ' + this.currentTime ) ;
    
    /* compute functions */
    this.compute_du_dt()    ;
    this.compute_dw_dt()    ;
    this.compute_dtheta_dt();
    this.compute_dpi_dt()   ;

    /* Data pass routine */
    for (var i=0;i<con.NX;i++){
        for (var k=0;k<con.NZ;k++){
            this.thm[k][i] = this.th[k][i]   ; 
            this.th[k][i]  = this.thp[k][i]  ;
            
            this.um[k][i]  = this.u[k][i]    ;  
            this.u[k][i]   = this.up[k][i]   ; 
            
            this.wm[k][i]  = this.w[k][i]    ; 
            this.w[k][i]   = this.wp[k][i]   ;
            
            this.pim[k][i] = this.pi[k][i]   ; 
            this.pi[k][i]  = this.pip[k][i]  ;
        }    
    }
   
    /* timestep routine */
    this.currentTime += con.DT ;        
    if ( updatePlot ) this.updatePlot() ;
};


WholeGrid.prototype.newPlot = function(){
    
    var data =  [{
                    x : this.xgrid,
                    y : this.zgrid,
                    z : this.th ,
                    type  : 'heatmap'

                }] ;
    var layout = {
        title : 'Time = '  + 0.0 + ' (sec) '
    } ; 
    Plotly.newPlot(modelShow, data, layout);

};


WholeGrid.prototype.updatePlot = function(){
    
    modelShow.data.push({
        z : this.th ,
    }) ;
    modelShow.layout.title = 'Time = ' + this.currentTime + ' (sec) ' ;
    Plotly.redraw(modelShow) ;
};

function pressRun(){
    var deferred = $.Deferred();
    var promise = deferred.promise();
    var iter_max = 99 ;
    var iter_now = 0  ;
    
    var showBar = function(){};
    var fadeBar = function(){};
    
    var updateBar = function(){
        var percent = Math.round( iter_now/ iter_max * 100 ) ;
        $('#runProgress').data('progress',percent);
        $('#runProgress').css({ 'width' : percent + '%' }) ;
        $('#runProgress').html(percent + '%' );   
    };
    
    var calculate = function(){

        var index = 0 ; 
        while ( index < 10 && iter_now < iter_max ){
            grid.compute_all(false) ;
            iter_now++ ;
            index++ ;
        }
        updateBar();
        
        if( iter_now == iter_max ){
            grid.compute_all(true);
            updateBar();
        }else{
            setTimeout( calculate , 10 ) ;
        }
    };
    
    
    //setInterval( calculate , 200 )  ;
    setTimeout( calculate , 0 ) ;
}


function updateParameter(event){
    event.preventDefault() ;
    grid = new WholeGrid() ;
    grid.baseState_OneDimension_Initialization();
    grid.perturbation_Initialization_Cold();
    grid.newPlot() ;
    updateControlValue() ;
}

function updateControlValue(){
    $('#init_delta').val(grid.delta);
    $('#init_radx').val(grid.radx);
    $('#init_radz').val(grid.radz);
    $('#init_zcnt').val(grid.zcnt);
    $('#init_imid').val(grid.imid);
}

var grid = new WholeGrid() ;
grid.baseState_OneDimension_Initialization();
grid.perturbation_Initialization_Cold();
grid.newPlot() ;
updateControlValue() ;









