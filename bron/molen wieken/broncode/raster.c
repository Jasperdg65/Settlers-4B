#include <math.h>
#include <stdint.h>
#include <stdlib.h>
void raster(int width,int count,const double *v,const double *rgb,uint8_t *pixels,int channels) {
 double *depth=malloc(width*width*sizeof(double));
 for(int k=0;k<width*width;k++)depth[k]=-1e30;
 for(int t=0;t<count;t++) {
  const double *p=v+t*9,*c=rgb+t*9;
  int x0=fmax(0,floor(fmin(p[0],fmin(p[3],p[6]))));
  int x1=fmin(width-1,ceil(fmax(p[0],fmax(p[3],p[6]))));
  int y0=fmax(0,floor(fmin(p[1],fmin(p[4],p[7]))));
  int y1=fmin(width-1,ceil(fmax(p[1],fmax(p[4],p[7]))));
  double den=(p[4]-p[7])*(p[0]-p[6])+(p[6]-p[3])*(p[1]-p[7]);
  if(fabs(den)<1e-10)continue;
  for(int y=y0;y<=y1;y++)for(int x=x0;x<=x1;x++) {
   double a=((p[4]-p[7])*(x+.5-p[6])+(p[6]-p[3])*(y+.5-p[7]))/den;
   double b=((p[7]-p[1])*(x+.5-p[6])+(p[0]-p[6])*(y+.5-p[7]))/den;
   double cc=1-a-b;
   if(a<0||b<0||cc<0)continue;
   double z=a*p[2]+b*p[5]+cc*p[8];int ix=y*width+x;
   if(z<depth[ix])continue;depth[ix]=z;
   for(int j=0;j<3;j++)pixels[ix*channels+j]=(uint8_t)fmax(0,fmin(255,a*c[j]+b*c[j+3]+cc*c[j+6]));
   if(channels==4)pixels[ix*channels+3]=255;
  }
 }
 free(depth);
}
